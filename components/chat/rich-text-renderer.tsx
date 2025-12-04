import { parseMentions, MentionPart } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RichTextRendererProps {
    content: string;
    className?: string;
}

export function RichTextRenderer({ content, className }: RichTextRendererProps) {
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

                    // Style based on mention type
                    const mentionClass = cn(
                        "inline-flex items-center rounded-sm px-1 py-0.5 font-medium transition-colors",
                        isSpecial
                            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20"
                            : isWiki
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                    );

                    // For now, we render as spans, but could be Links if we have routes
                    // e.g. /profile/[id] or /wiki/[slug]
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
