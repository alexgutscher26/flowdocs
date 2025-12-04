export type MentionType = "user" | "channel" | "wiki" | "special";

export interface MentionSuggestion {
  id: string;
  display: string;
  type: MentionType;
  image?: string;
  metadata?: Record<string, any>;
}

export interface MentionPart {
  type: "text" | "mention";
  content: string;
  mentionType?: MentionType;
  id?: string;
}

// Special mentions
export const SPECIAL_MENTIONS: MentionSuggestion[] = [
  {
    id: "here",
    display: "here",
    type: "special",
    metadata: { description: "Notify everyone currently online" },
  },
  {
    id: "channel",
    display: "channel",
    type: "special",
    metadata: { description: "Notify everyone in this channel" },
  },
];

/**
 * Parse content into parts (text and mentions)
 * Format for mentions in storage: @[display](type:id)
 * Example: "Hello @[Alice](user:123) check @[Docs](wiki:456)"
 *
 * Supports both:
 * 1. Rich format: @[display](type:id) - precise
 * 2. Simple format: @username - legacy/simple input
 */
export function parseMentions(content: string): MentionPart[] {
  const parts: MentionPart[] = [];

  // Regex for rich mentions: @[display](type:id)
  // And simple mentions: @username (word boundary)
  // Group 1: Full rich mention
  // Group 2: display
  // Group 3: type
  // Group 4: id
  // Group 5: Full simple mention
  // Group 6: username
  const regex = /(@\[([^\]]+)\]\(([^:]+):([^)]+)\))|(@(\w+))/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // Rich mention: @[display](type:id)
      const display = match[2];
      const type = match[3] as MentionType;
      const id = match[4];

      parts.push({
        type: "mention",
        content: display,
        mentionType: type,
        id: id,
      });
    } else {
      // Simple mention: @username
      const mentionText = match[6];
      let type: MentionType = "user";

      if (["here", "channel"].includes(mentionText)) {
        type = "special";
      } else if (mentionText.toLowerCase().startsWith("wiki")) {
        // Basic heuristic for simple wiki mentions
        type = "wiki";
      }

      parts.push({
        type: "mention",
        content: mentionText,
        mentionType: type,
        id: mentionText, // Using name as ID for simple mentions
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return parts;
}

/**
 * Get suggestions based on query
 */
export function getMentionSuggestions(
  query: string,
  users: { userId: string; user: { name: string | null; image: string | null } }[],
  wikiPages: { id: string; title: string }[] = [] // Placeholder for wiki pages
): MentionSuggestion[] {
  const normalizedQuery = query.toLowerCase();
  const suggestions: MentionSuggestion[] = [];

  // 1. Special mentions (if query matches)
  if (query.length > 0) {
    SPECIAL_MENTIONS.forEach((special) => {
      if (special.display.startsWith(normalizedQuery)) {
        suggestions.push(special);
      }
    });
  }

  // 2. Users
  users.forEach((member) => {
    const name = member.user.name || "Unknown";
    if (name.toLowerCase().includes(normalizedQuery)) {
      suggestions.push({
        id: member.userId,
        display: name,
        type: "user",
        image: member.user.image || undefined,
      });
    }
  });

  // 3. Wiki Pages (if we had them passed in)
  // For now, we can mock or leave empty until we integrate wiki search
  wikiPages.forEach((page) => {
    if (page.title.toLowerCase().includes(normalizedQuery)) {
      suggestions.push({
        id: page.id,
        display: page.title,
        type: "wiki",
      });
    }
  });

  return suggestions.slice(0, 10); // Limit to 10 suggestions
}

/**
 * Extract mention IDs for backend processing (notifications)
 */
export function extractMentionIds(content: string): string[] {
  const mentions = parseMentions(content);
  return mentions
    .filter((part) => part.type === "mention")
    .map((part) => part.id!)
    .filter(Boolean);
}
