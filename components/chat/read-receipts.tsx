"use client";

import { ReadReceipt } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, CheckCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/message-utils";

interface ReadReceiptsProps {
    readBy: ReadReceipt[];
    totalMembers: number;
    currentUserId: string;
}

export function ReadReceipts({
    readBy,
    totalMembers,
    currentUserId,
}: ReadReceiptsProps) {
    // Filter out current user from read receipts
    const otherReaders = readBy.filter((r) => r.userId !== currentUserId);

    if (otherReaders.length === 0) {
        return (
            <div className="flex items-center gap-1 text-muted-foreground">
                <Check className="h-3 w-3" />
            </div>
        );
    }

    const allRead = otherReaders.length >= totalMembers - 1; // -1 for current user

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-0.5">
                        {allRead ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                            <CheckCheck className="h-3 w-3 text-muted-foreground" />
                        )}
                        {otherReaders.length > 0 && otherReaders.length <= 3 && (
                            <div className="flex -space-x-1">
                                {otherReaders.slice(0, 3).map((reader) => (
                                    <Avatar key={reader.userId} className="h-4 w-4 border border-background">
                                        <AvatarImage src={reader.userImage || undefined} />
                                        <AvatarFallback className="text-[8px]">
                                            {reader.userName?.[0]?.toUpperCase() || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                    <div className="text-xs space-y-1">
                        <p className="font-semibold">
                            Read by {otherReaders.length}{" "}
                            {otherReaders.length === 1 ? "person" : "people"}
                        </p>
                        {otherReaders.slice(0, 5).map((reader) => (
                            <p key={reader.userId}>
                                {reader.userName} • {formatRelativeTime(reader.readAt)}
                            </p>
                        ))}
                        {otherReaders.length > 5 && (
                            <p className="text-muted-foreground">
                                and {otherReaders.length - 5} more...
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
