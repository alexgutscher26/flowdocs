import { parseMentions, MentionPart } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RichTextRendererProps {
  content: string;
  workspaceId: string;
  className?: string;
}

/**
 * Renders rich text content with mentions and styles based on mention types.
 *
 * The function parses the input content for mentions and text parts, then maps over these parts to render them accordingly.
 * Mentions are styled based on their type (special, wiki, or user), with wiki mentions linking to a specific page using the workspaceId.
 * The function returns a div containing the rendered parts.
 *
 * @param {RichTextRendererProps} props - The properties for rendering rich text, including content, workspaceId, and className.
 * @returns {JSX.Element} The rendered rich text as a JSX element.
 */
export function RichTextRenderer({ content, workspaceId, className }: RichTextRendererProps) {
  const parts = parseMentions(content);

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.content}</span>;
        }

        if (part.type === "mention") {
          const isSpecial = part.mentionType === "special";
          const isWiki = part.mentionType === "wiki";
          const isUser = part.mentionType === "user";

          // Style based on mention type
          const mentionClass = cn(
            "inline-flex items-center rounded-sm px-1 py-0.5 font-medium transition-colors cursor-pointer",
            isSpecial
              ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20"
              : isWiki
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:underline"
                : "bg-primary/10 text-primary hover:bg-primary/20"
          );

          // Make wiki mentions clickable
          if (isWiki && part.id) {
            // The ID is the wiki page ID, we need to link to it
            // Since we don't have the slug here, we'll link to the wiki page by ID
            // The wiki page route is /dashboard/wiki/[workspaceId]/[slug]
            // We can use a query param approach or fetch the slug
            // For simplicity, let's link to the wiki list with a search param
            return (
              <Link
                key={index}
                href={`/dashboard/wiki/${workspaceId}?pageId=${part.id}`}
                className={mentionClass}
                title={`Wiki: ${part.content}`}
              >
                @{part.content}
              </Link>
            );
          }

          // For user mentions, could link to profile (future enhancement)
          // For now, render as spans
          return (
            <span key={index} className={mentionClass} title={`${part.mentionType}: ${part.id}`}>
              @{part.content}
            </span>
          );
        }

        return null;
      })}
    </div>
  );
}
