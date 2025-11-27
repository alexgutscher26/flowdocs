"use client";

import { MessageReaction } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
    reactions: MessageReaction[];
    currentUserId: string;
    onReactionClick: (emoji: string) => void;
    onReactionRemove: (reactionId: string) => void;
}

export function MessageReactions({
    reactions,
    currentUserId,
    onReactionClick,
    onReactionRemove,
}: MessageReactionsProps) {
    if (!reactions || reactions.length === 0) return null;

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return {};
    }, {} as Record<string, MessageReaction[]>);

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
                const hasReacted = reactionList.some((r) => r.userId === currentUserId);
                const myReaction = reactionList.find((r) => r.userId === currentUserId);
                const count = reactionList.length;

                const tooltipContent = reactionList
                    .map((r) => r.userName || "Unknown")
                    .join(", ");

                return (
                    <TooltipProvider key={emoji}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => {
                                        if (hasReacted && myReaction) {
                                            onReactionRemove(myReaction.id);
                                        } else {
                                            onReactionClick(emoji);
                                        }
                                    }}
                                    className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
                                        hasReacted
                                            ? "bg-primary/20 border-primary/50 border"
                                            : "bg-muted hover:bg-muted/80 border border-transparent"
                                    )}
                                >
                                    <span>{emoji}</span>
                                    {count > 1 && (
                                        <span className="text-xs font-medium">{count}</span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{tooltipContent}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
}
