import {
  answerQuestion,
  summarizeThread,
  suggestWikiPage,
  findRelatedConversations,
  extractActionItems,
} from "../lib/ai/knowledge-base";

console.log("Verifying AI Knowledge Base imports...");

async function verify() {
  console.log("Functions imported successfully:");
  console.log("- answerQuestion:", typeof answerQuestion);
  console.log("- summarizeThread:", typeof summarizeThread);
  console.log("- suggestWikiPage:", typeof suggestWikiPage);
  console.log("- findRelatedConversations:", typeof findRelatedConversations);
  console.log("- extractActionItems:", typeof extractActionItems);
}

verify().catch(console.error);
