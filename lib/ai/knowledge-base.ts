import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { searchMessages, searchWikiPages, SearchOptions } from "@/lib/search";
import { Message } from "@/generated/prisma/client";

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
const MAX_CONTEXT_LENGTH = 4000; // Characters
const DEFAULT_SEARCH_LIMIT = 10;
const DEFAULT_WIKI_LIMIT = 5;

if (!OPENROUTER_API_KEY) {
  console.warn("⚠️  OPENROUTER_API_KEY is not set. AI features will not work.");
}

// Configure OpenRouter
const openrouter = createOpenAI({
  apiKey: OPENROUTER_API_KEY || "dummy-key",
  baseURL: "https://openrouter.ai/api/v1",
});

// Define the model to use
const model = openrouter(OPENROUTER_MODEL);

// Improved System Prompts
const ANSWER_QUESTION_PROMPT = `You are an AI assistant for FlowDocs, a team communication and knowledge base platform combining real-time chat and wiki documentation (similar to Slack + Notion).

## Your Role
Provide accurate, helpful answers based on the team's actual workspace content. Be conversational yet professional.

## Core Capabilities
- Search across messages and wiki pages
- Understand context from chat threads and documentation
- Connect related information across different sources
- Identify knowledge gaps when information is incomplete

## Response Guidelines
1. **When Context is Available:**
   - Answer directly using the provided context
   - Reference specific sources (e.g., "According to the wiki page on...")
   - If multiple sources conflict, acknowledge the discrepancy
   - If context is partial, answer what you can and note what's missing
   - Stay grounded in the actual content—don't hallucinate details

2. **When No Context is Available:**
   - Explain that this is a new workspace without indexed content yet
   - Describe relevant FlowDocs features that would help
   - Suggest concrete next steps (create channels, wiki pages, etc.)
   - Be encouraging about building their knowledge base

3. **Always:**
   - Keep responses concise (2-4 paragraphs max)
   - Use natural language, avoid robotic phrasing
   - Format for readability (but don't overuse bullet points)
   - End with a clear takeaway or next step when appropriate

## FlowDocs Features Reference
- Real-time chat: channels, threads, DMs, mentions, reactions
- Wiki pages: markdown support, version history, full-text search
- Integration: convert conversations to documentation
- Collaboration: file sharing, presence indicators, real-time updates
- Storage: AWS S3/Cloudflare R2 for files`;

const SUMMARIZE_THREAD_PROMPT = `You are an expert at distilling conversations into clear, actionable summaries.

## Your Task
Analyze the conversation thread and create a concise summary that captures what matters most.

## What to Extract
1. **Main Discussion Points**: What topics were covered?
2. **Key Decisions**: What was decided or agreed upon?
3. **Action Items**: What needs to be done next? By whom?
4. **Important Context**: Background info or constraints mentioned
5. **Open Questions**: What remains unresolved?

## Format Guidelines
- Start with a 1-sentence overview of the conversation
- Use clear sections for decisions, actions, and open items
- Keep total summary under 200 words unless the thread is very long
- Use specific details (names, dates, numbers) when mentioned
- Write in past tense for completed discussions
- Prioritize information by importance—don't just recap chronologically

## Tone
Professional but conversational. Imagine briefing a team member who missed the conversation.`;

const SUGGEST_WIKI_PAGE_PROMPT = `You are a technical documentation specialist who transforms conversations into high-quality wiki pages.

## Your Mission
Extract valuable knowledge from this conversation and structure it as permanent, searchable documentation.

## Content Strategy
**Transform conversational content into:**
- Clear explanations that work standalone (without the original context)
- Actionable information (how-tos, decisions, processes)
- Well-organized sections with descriptive headings
- Examples and context where helpful
- Links to related concepts using placeholders like [[Related Topic]]

## Quality Standards
1. **Title**: Descriptive, searchable, 4-8 words (e.g., "Customer Onboarding Process" not "Meeting Notes")
2. **Slug**: lowercase-with-hyphens, no special characters
3. **Content Structure**:
   - Start with 2-3 sentence overview
   - Use ## for main sections, ### for subsections
   - Include code blocks with language tags when relevant
   - Add context or rationale for decisions
   - End with "Related Pages" or "Next Steps" if applicable
4. **Tags**: 3-5 relevant tags (specific > general)
5. **Excerpt**: One compelling sentence that makes someone want to read more

## What Makes Great Documentation
- **Findable**: Use terms people will search for
- **Scannable**: Headers, short paragraphs, bullet points for lists
- **Complete**: Enough context to understand without the original chat
- **Evergreen**: Focus on lasting information, not time-bound details
- **Practical**: Include examples, not just theory

## Avoid
- Verbatim chat transcripts
- "We discussed..." or "The team talked about..." framing
- Overly casual language
- Unstructured walls of text`;

const EXTRACT_ACTION_ITEMS_PROMPT = `You are a project coordinator skilled at identifying commitments and tasks from discussions.

## Your Task
Extract every actionable item from the text—anything that represents work to be done, decisions to implement, or follow-ups required.

## What Qualifies as an Action Item
✅ Tasks with clear outcomes ("Update the API documentation")
✅ Decisions that require implementation ("Switch to the new auth flow")
✅ Follow-ups and deadlines ("Review by Friday")
✅ Assignments or responsibilities ("Sarah will handle the deployment")
✅ Questions requiring answers ("Check if the API supports pagination")

❌ NOT action items: completed work, general discussion, background info

## Extraction Guidelines
1. **Task Description**: Use clear, imperative language ("Create", "Review", "Send")
2. **Assignee Detection**: 
   - Look for explicit assignments ("John will...", "@sarah can you...")
   - Leave empty if not specified—don't guess
3. **Priority Assessment**:
   - High: Urgent language, blockers, deadlines mentioned
   - Medium: Important but no urgency indicated
   - Low: Nice-to-haves, future considerations
   - Leave empty if priority isn't clear

## Output Quality
- Each task should be standalone—understandable without reading the original
- Include relevant context in the task itself ("Update docs *to reflect new API*")
- If one sentence contains multiple tasks, break them apart
- Maintain original specificity (dates, numbers, names)`;

/**
 * Answer a question using RAG (Retrieval Augmented Generation)
 * based on team knowledge (messages and wiki pages).
 */
export async function answerQuestion(query: string, workspaceId: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables."
    );
  }

  if (!query?.trim()) {
    throw new Error("Query cannot be empty");
  }

  if (!workspaceId?.trim()) {
    throw new Error("Workspace ID is required");
  }

  try {
    // 1. Retrieve relevant context from Typesense
    const searchOptions: SearchOptions = { limit: DEFAULT_SEARCH_LIMIT };
    const wikiSearchOptions: SearchOptions = { limit: DEFAULT_WIKI_LIMIT };

    const [messageResults, wikiResults] = await Promise.all([
      searchMessages(query, { workspaceId }, searchOptions),
      searchWikiPages(query, { workspaceId }, wikiSearchOptions),
    ]);

    const contextParts: string[] = [];
    const sources: string[] = [];
    let totalLength = 0;

    // Process message results with length limit
    if (messageResults.hits && Array.isArray(messageResults.hits)) {
      for (const hit of messageResults.hits) {
        const doc = hit.document;
        if (!doc) continue;

        const content = doc.content || "";
        const contextEntry = `Message by ${doc.userId || "unknown"} in channel ${doc.channelId || "unknown"}: "${content}"`;

        if (totalLength + contextEntry.length > MAX_CONTEXT_LENGTH) break;

        contextParts.push(contextEntry);
        sources.push(`Message in channel ${doc.channelId || "unknown"}`);
        totalLength += contextEntry.length;
      }
    }

    // Process wiki results with length limit
    if (wikiResults.hits && Array.isArray(wikiResults.hits)) {
      for (const hit of wikiResults.hits) {
        const doc = hit.document;
        if (!doc) continue;

        const title = doc.title || "Untitled";
        const content = (doc.content || "").substring(0, 500);
        const contextEntry = `Wiki Page "${title}":\n${content}${content.length >= 500 ? "..." : ""}`;

        if (totalLength + contextEntry.length > MAX_CONTEXT_LENGTH) break;

        contextParts.push(contextEntry);
        sources.push(`Wiki: ${title}`);
        totalLength += contextEntry.length;
      }
    }

    const hasContext = contextParts.length > 0;
    const context = hasContext ? contextParts.join("\n\n") : "No indexed content available yet.";

    // 2. Generate answer with improved prompt
    const systemPrompt = hasContext
      ? ANSWER_QUESTION_PROMPT
      : `${ANSWER_QUESTION_PROMPT}\n\nIMPORTANT: This workspace has no indexed content yet. Focus on explaining FlowDocs features and how to get started.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: hasContext
        ? `Context from workspace:\n${context}\n\nUser Question: ${query}`
        : `Question: ${query}\n\nNote: This is a new workspace with no content yet. Help the user understand FlowDocs and how to get started.`,
    });

    return {
      answer: text,
      sources: hasContext ? [...new Set(sources)].slice(0, 5) : [],
    };
  } catch (error) {
    console.error("Error in answerQuestion:", error);
    throw new Error(
      error instanceof Error ? `AI Error: ${error.message}` : "Failed to generate AI response"
    );
  }
}

/**
 * Summarize a conversation thread.
 * @param messages - Array of messages to summarize
 * @returns Summary text
 */
export async function summarizeThread(messages: Message[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  if (!messages || messages.length === 0) {
    return "No messages to summarize.";
  }

  try {
    const transcript = messages.map((m) => `${m.userId}: ${m.content}`).join("\n");

    const { text } = await generateText({
      model,
      system: SUMMARIZE_THREAD_PROMPT,
      prompt: `Summarize this ${messages.length}-message conversation thread:\n\n${transcript.substring(0, MAX_CONTEXT_LENGTH)}`,
    });

    return text;
  } catch (error) {
    console.error("Error in summarizeThread:", error);
    throw new Error("Failed to summarize thread");
  }
}

/**
 * Suggest a wiki page based on a conversation thread.
 * Returns title, slug, and markdown content.
 * @param messages - Array of messages to analyze
 * @returns Structured wiki page suggestion
 */
export async function suggestWikiPage(messages: Message[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  if (!messages || messages.length === 0) {
    throw new Error("No messages provided for wiki page suggestion");
  }

  try {
    const transcript = messages.map((m) => `${m.userId}: ${m.content}`).join("\n");

    const { object } = await generateObject({
      model,
      schema: z.object({
        title: z.string().describe("A clear, descriptive title for the wiki page"),
        slug: z.string().describe("A URL-friendly slug (lowercase, hyphens, no spaces)"),
        content: z.string().describe("Well-formatted markdown content for the page"),
        tags: z.array(z.string()).describe("3-5 relevant tags for categorization"),
        excerpt: z.string().optional().describe("A brief 1-2 sentence summary"),
      }),
      system: SUGGEST_WIKI_PAGE_PROMPT,
      prompt: `Create a comprehensive wiki page from this ${messages.length}-message conversation:\n\n${transcript.substring(0, MAX_CONTEXT_LENGTH)}`,
    });

    return object;
  } catch (error) {
    console.error("Error in suggestWikiPage:", error);
    throw new Error("Failed to generate wiki page suggestion");
  }
}

/**
 * Find related conversations based on a query.
 * This uses the search index to find semantically similar messages.
 */
export async function findRelatedConversations(query: string, workspaceId: string) {
  const results = await searchMessages(query, { workspaceId }, { limit: 20 });

  // Group hits by threadId (if available) or channelId
  const related = new Map<string, { count: number; snippet: string }>();

  if (results.hits) {
    results.hits.forEach((hit: any) => {
      const doc = hit.document;
      const key = doc.channelId;

      if (!related.has(key)) {
        related.set(key, { count: 0, snippet: doc.content });
      }
      const item = related.get(key)!;
      item.count++;
    });
  }

  return Array.from(related.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
}

/**
 * Extract action items from text.
 */
export async function extractActionItems(text: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured");
  }

  if (!text?.trim()) {
    return [];
  }

  try {
    const { object } = await generateObject({
      model,
      schema: z.object({
        actionItems: z.array(
          z.object({
            task: z.string(),
            assignee: z.string().optional(),
            priority: z.enum(["low", "medium", "high"]).optional(),
          })
        ),
      }),
      system: EXTRACT_ACTION_ITEMS_PROMPT,
      prompt: `Extract all action items from the following text:\n\n${text.substring(0, MAX_CONTEXT_LENGTH)}`,
    });

    return object.actionItems;
  } catch (error) {
    console.error("Error in extractActionItems:", error);
    throw new Error("Failed to extract action items");
  }
}