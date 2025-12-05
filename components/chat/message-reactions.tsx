"use client";

import { MessageReaction } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onReactionClick: (emoji: string) => void;
  onReactionRemove: (reactionId: string) => void;
}

/**
 * Renders a list of message reactions grouped by emoji.
 *
 * The function first checks if there are any reactions; if not, it returns null. It then groups the reactions by emoji using reduce, creating an object where each key is an emoji and the value is an array of reactions. For each emoji, it determines if the current user has reacted and displays the appropriate button with a tooltip showing the number of reactions and the users who reacted.
 *
 * @param reactions - An array of MessageReaction objects representing the reactions to a message.
 * @param currentUserId - The ID of the current user to check for their reactions.
 * @param onReactionClick - A callback function to handle adding a reaction when the button is clicked.
 * @param onReactionRemove - A callback function to handle removing a reaction when the button is clicked.
 * @returns A JSX element representing the grouped reactions or null if there are no reactions.
 */
export function MessageReactions({
  reactions,
  currentUserId,
  onReactionClick,
  onReactionRemove,
}: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {} as Record<string, MessageReaction[]>
  );

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasReacted = reactionList.some((r) => r.userId === currentUserId);
        const myReaction = reactionList.find((r) => r.userId === currentUserId);
        const count = reactionList.length;

        return (
          <TooltipProvider key={emoji} delayDuration={200}>
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
                    "group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    hasReacted
                      ? "bg-primary/20 border-primary/50 border shadow-sm animate-in zoom-in-95 duration-200"
                      : "bg-muted hover:bg-muted/80 border border-transparent hover:border-border"
                  )}
                  aria-label={`${hasReacted ? "Remove" : "Add"} ${emoji} reaction`}
                >
                  <span className="text-base leading-none transition-transform group-hover:scale-110">
                    {emoji}
                  </span>
                  {count > 1 && (
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        hasReacted ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <p className="text-xs font-medium">
                    {reactionList.length === 1
                      ? "Reacted with"
                      : `${reactionList.length} people reacted with`}{" "}
                    {emoji}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {reactionList.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={r.userImage || undefined} alt={r.userName || "User"} />
                          <AvatarFallback className="text-[10px]">
                            {(r.userName || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{r.userName || "Unknown"}</span>
                      </div>
                    ))}
                    {reactionList.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{reactionList.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
