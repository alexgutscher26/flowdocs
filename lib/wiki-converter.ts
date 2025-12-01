import { ExtendedMessage } from "@/types/chat";

/**
 * Configuration options for wiki conversion
 */
export interface WikiConversionOptions {
  /**
   * Whether to include AI-enhanced summaries (requires AI integration)
   */
  useAI?: boolean;

  /**
   * Minimum number of messages to consider a thread significant
   */
  minMessageThreshold?: number;

  /**
   * Whether to automatically generate tags
   */
  autoTag?: boolean;

  /**
   * Maximum length for the excerpt/summary
   */
  maxExcerptLength?: number;
}

/**
 * Result of wiki conversion
 */
export interface WikiConversionResult {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  metadata: {
    messageCount: number;
    participantCount: number;
    hasCode: boolean;
    hasLinks: boolean;
    keyDecisions: string[];
  };
}

/**
 * Represents a structured section in the wiki page
 */
interface ContentSection {
  type: "heading" | "paragraph" | "code" | "list" | "quote" | "decision";
  content: string;
  author?: string;
  timestamp?: Date;
}

/**
 * Main class for converting chat threads to wiki pages
 */
export class WikiConverter {
  private options: Required<WikiConversionOptions>;

  constructor(options: WikiConversionOptions = {}) {
    this.options = {
      useAI: options.useAI ?? false,
      minMessageThreshold: options.minMessageThreshold ?? 3,
      autoTag: options.autoTag ?? true,
      maxExcerptLength: options.maxExcerptLength ?? 200,
    };
  }

  /**
   * Main conversion method - transforms a thread into a wiki page
   */
  async convertThreadToWiki(
    messages: ExtendedMessage[],
    threadTitle?: string
  ): Promise<WikiConversionResult> {
    // Analyze thread
    const analysis = this.analyzeThread(messages);

    // Extract structured content
    const sections = this.extractStructure(messages);

    // Generate title and slug
    const title = threadTitle || this.generateTitle(messages, analysis);
    const slug = this.generateSlug(title);

    // Convert to markdown
    const content = this.formatAsMarkdown(sections, analysis);

    // Generate summary
    const excerpt = await this.generateSummary(messages, analysis);

    // Auto-tag if enabled
    const tags = this.options.autoTag ? this.generateTags(messages, analysis) : [];

    return {
      title,
      slug,
      content,
      excerpt,
      tags,
      metadata: {
        messageCount: messages.length,
        participantCount: analysis.uniqueParticipants,
        hasCode: analysis.hasCodeBlocks,
        hasLinks: analysis.hasLinks,
        keyDecisions: analysis.keyDecisions,
      },
    };
  }

  /**
   * Analyze thread to identify key characteristics
   */
  private analyzeThread(messages: ExtendedMessage[]): ThreadAnalysis {
    const participants = new Set<string>();
    const codeBlocks: string[] = [];
    const links: string[] = [];
    const keyDecisions: string[] = [];
    const questions: string[] = [];
    const decisions: string[] = [];

    messages.forEach((msg) => {
      participants.add(msg.userId);

      // Detect code blocks
      const codeMatches = msg.content.match(/```[\s\S]*?```|`[^`]+`/g);
      if (codeMatches) {
        codeBlocks.push(...codeMatches);
      }

      // Detect links
      const linkMatches = msg.content.match(/https?:\/\/[^\s]+/g);
      if (linkMatches) {
        links.push(...linkMatches);
      }

      // Detect questions (messages ending with ?)
      if (msg.content.trim().endsWith("?")) {
        questions.push(msg.content);
      }

      // Detect decisions (messages with keywords like "decided", "will", "should")
      const decisionKeywords = /\b(decided|will|should|must|agreed|resolved)\b/i;
      if (decisionKeywords.test(msg.content)) {
        decisions.push(msg.content);
      }

      // Detect action items
      const actionPattern = /(?:TODO|FIXME|ACTION|@\w+.*?:)/gi;
      if (actionPattern.test(msg.content)) {
        keyDecisions.push(msg.content.substring(0, 100));
      }
    });

    return {
      messageCount: messages.length,
      uniqueParticipants: participants.size,
      hasCodeBlocks: codeBlocks.length > 0,
      codeBlockCount: codeBlocks.length,
      hasLinks: links.length > 0,
      linkCount: links.length,
      keyDecisions,
      questionCount: questions.length,
      decisionCount: decisions.length,
    };
  }

  /**
   * Extract structured content from messages
   */
  private extractStructure(messages: ExtendedMessage[]): ContentSection[] {
    const sections: ContentSection[] = [];

    messages.forEach((msg) => {
      const content = msg.content.trim();

      // Check if message starts with a heading
      if (content.match(/^#{1,6}\s/)) {
        sections.push({
          type: "heading",
          content: content,
          author: msg.user.name || msg.user.email,
          timestamp: new Date(msg.createdAt),
        });
        return;
      }

      // Check for code blocks
      if (content.match(/```[\s\S]*?```/)) {
        sections.push({
          type: "code",
          content: content,
          author: msg.user.name || msg.user.email,
          timestamp: new Date(msg.createdAt),
        });
        return;
      }

      // Check for lists
      if (content.match(/^[\-\*\+]\s|^\d+\.\s/m)) {
        sections.push({
          type: "list",
          content: content,
          author: msg.user.name || msg.user.email,
          timestamp: new Date(msg.createdAt),
        });
        return;
      }

      // Check for decision indicators
      const decisionKeywords = /\b(decided|will|should|must|agreed|resolved)\b/i;
      if (decisionKeywords.test(content)) {
        sections.push({
          type: "decision",
          content: content,
          author: msg.user.name || msg.user.email,
          timestamp: new Date(msg.createdAt),
        });
        return;
      }

      // Default to paragraph
      sections.push({
        type: "paragraph",
        content: content,
        author: msg.user.name || msg.user.email,
        timestamp: new Date(msg.createdAt),
      });
    });

    return sections;
  }

  /**
   * Format content sections as clean markdown
   */
  private formatAsMarkdown(sections: ContentSection[], analysis: ThreadAnalysis): string {
    let markdown = "";

    // Add metadata header
    markdown += `> **Thread Summary**: ${analysis.messageCount} messages from ${analysis.uniqueParticipants} participant(s)\n\n`;

    // Add key decisions section if any
    if (analysis.keyDecisions.length > 0) {
      markdown += "## Key Decisions\n\n";
      analysis.keyDecisions.forEach((decision) => {
        markdown += `- ${decision}\n`;
      });
      markdown += "\n";
    }

    // Add main content
    markdown += "## Discussion\n\n";

    sections.forEach((section, index) => {
      switch (section.type) {
        case "heading":
          markdown += `\n${section.content}\n\n`;
          break;

        case "code":
          markdown += `${section.content}\n\n`;
          if (section.author) {
            markdown += `*Code by ${section.author}*\n\n`;
          }
          break;

        case "list":
          markdown += `${section.content}\n\n`;
          break;

        case "decision":
          markdown += `> **Decision**: ${section.content}\n`;
          if (section.author) {
            markdown += `> — *${section.author}*\n`;
          }
          markdown += "\n";
          break;

        case "quote":
          markdown += `> ${section.content}\n\n`;
          break;

        case "paragraph":
          // Group consecutive paragraphs from same author
          const nextSection = sections[index + 1];
          const sameAuthor = nextSection?.author === section.author;

          markdown += `${section.content}\n\n`;

          // Add attribution if author changes or last message
          if (!sameAuthor && section.author) {
            markdown += `*— ${section.author}*\n\n`;
          }
          break;
      }
    });

    // Add links section if any
    if (analysis.hasLinks) {
      markdown += "## References\n\n";
      markdown += `This discussion referenced ${analysis.linkCount} external link(s).\n\n`;
    }

    return markdown.trim();
  }

  /**
   * Generate a concise summary/excerpt
   */
  private async generateSummary(
    messages: ExtendedMessage[],
    analysis: ThreadAnalysis
  ): Promise<string> {
    if (this.options.useAI) {
      // TODO: Integrate with AI service for smart summaries
      return this.generateBasicSummary(messages, analysis);
    }

    return this.generateBasicSummary(messages, analysis);
  }

  /**
   * Generate a basic summary without AI
   */
  private generateBasicSummary(messages: ExtendedMessage[], analysis: ThreadAnalysis): string {
    const firstMessage = messages[0];
    const summary = firstMessage.content.substring(0, this.options.maxExcerptLength);

    let excerpt = summary;
    if (summary.length === this.options.maxExcerptLength) {
      excerpt += "...";
    }

    // Add context
    if (analysis.hasCodeBlocks) {
      excerpt += " Includes code examples.";
    }

    if (analysis.decisionCount > 0) {
      excerpt += ` Contains ${analysis.decisionCount} decision(s).`;
    }

    return excerpt.trim();
  }

  /**
   * Generate tags based on content analysis
   */
  private generateTags(messages: ExtendedMessage[], analysis: ThreadAnalysis): string[] {
    const tags = new Set<string>();

    // Add tags based on content characteristics
    if (analysis.hasCodeBlocks) {
      tags.add("technical");
      tags.add("code");
    }

    if (analysis.questionCount > 2) {
      tags.add("q&a");
    }

    if (analysis.decisionCount > 0) {
      tags.add("decision");
    }

    // Detect programming languages
    const allContent = messages.map((m) => m.content).join(" ");
    const languages = this.detectLanguages(allContent);
    languages.forEach((lang) => tags.add(lang));

    // Detect common topics
    const topics = this.detectTopics(allContent);
    topics.forEach((topic) => tags.add(topic));

    return Array.from(tags).slice(0, 5); // Limit to 5 tags
  }

  /**
   * Detect programming languages in content
   */
  private detectLanguages(content: string): string[] {
    const languages: string[] = [];
    const patterns = {
      javascript: /\b(const|let|var|function|=>|React|Node\.js)\b/i,
      typescript: /\b(interface|type|enum|namespace|import\s+type)\b/i,
      python: /\b(def|import|class|from|__init__|self)\b/i,
      java: /\b(public|private|class|void|static|extends)\b/i,
      sql: /\b(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE)\b/i,
      css: /\b(display|flex|grid|margin|padding|color)\b/i,
    };

    Object.entries(patterns).forEach(([lang, pattern]) => {
      if (pattern.test(content)) {
        languages.push(lang);
      }
    });

    return languages;
  }

  /**
   * Detect common topics
   */
  private detectTopics(content: string): string[] {
    const topics: string[] = [];
    const patterns = {
      "bug-fix": /\b(bug|fix|error|issue|problem)\b/i,
      feature: /\b(feature|implement|add|new)\b/i,
      documentation: /\b(docs|documentation|readme|guide)\b/i,
      api: /\b(api|endpoint|route|request|response)\b/i,
      database: /\b(database|db|schema|migration|query)\b/i,
      testing: /\b(test|testing|unit|integration)\b/i,
      security: /\b(security|auth|authentication|permission)\b/i,
    };

    Object.entries(patterns).forEach(([topic, pattern]) => {
      if (pattern.test(content)) {
        topics.push(topic);
      }
    });

    return topics;
  }

  /**
   * Generate a title from thread content
   */
  private generateTitle(messages: ExtendedMessage[], analysis: ThreadAnalysis): string {
    const firstMessage = messages[0];

    // Try to extract a title from the first message
    const firstLine = firstMessage.content.split("\n")[0].trim();

    // Remove markdown heading symbols if present
    const cleanedLine = firstLine.replace(/^#{1,6}\s*/, "");

    // Limit length
    const maxTitleLength = 60;
    if (cleanedLine.length > maxTitleLength) {
      return cleanedLine.substring(0, maxTitleLength) + "...";
    }

    return cleanedLine || "Untitled Discussion";
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  }
}

/**
 * Thread analysis result
 */
interface ThreadAnalysis {
  messageCount: number;
  uniqueParticipants: number;
  hasCodeBlocks: boolean;
  codeBlockCount: number;
  hasLinks: boolean;
  linkCount: number;
  keyDecisions: string[];
  questionCount: number;
  decisionCount: number;
}

/**
 * Helper function to quickly convert a thread
 */
export async function convertThreadToWiki(
  messages: ExtendedMessage[],
  threadTitle?: string,
  options?: WikiConversionOptions
): Promise<WikiConversionResult> {
  const converter = new WikiConverter(options);
  return converter.convertThreadToWiki(messages, threadTitle);
}
