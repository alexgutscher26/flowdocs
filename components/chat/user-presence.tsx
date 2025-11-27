"use client";

import { cn } from "@/lib/utils";
import { PresenceStatus } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/message-utils";

interface UserPresenceProps {
    userId: string;
    userName: string | null;
    userImage: string | null;
    status: PresenceStatus;
    lastSeen?: Date;
    showAvatar?: boolean;
    size?: "sm" | "md" | "lg";
}

export function UserPresence({
    userId,
    userName,
    userImage,
    status,
    lastSeen,
    showAvatar = true,
    size = "md",
}: UserPresenceProps) {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
    };

    const dotSizeClasses = {
        sm: "h-2 w-2",
        md: "h-2.5 w-2.5",
        lg: "h-3 w-3",
    };

    const statusColors = {
        [PresenceStatus.ONLINE]: "bg-green-500",
        [PresenceStatus.AWAY]: "bg-yellow-500",
        [PresenceStatus.OFFLINE]: "bg-gray-400",
    };

    const statusLabels = {
        [PresenceStatus.ONLINE]: "Online",
        [PresenceStatus.AWAY]: "Away",
        [PresenceStatus.OFFLINE]: lastSeen ? `Last seen ${formatRelativeTime(lastSeen)}` : "Offline",
    };

    const initials = userName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?";

    if (!showAvatar) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "rounded-full border-2 border-background",
                                dotSizeClasses[size],
                                statusColors[status]
                            )}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{statusLabels[status]}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative inline-block">
                        <Avatar className={sizeClasses[size]}>
                            <AvatarImage src={userImage || undefined} alt={userName || "User"} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                "absolute bottom-0 right-0 rounded-full border-2 border-background",
                                dotSizeClasses[size],
                                statusColors[status]
                            )}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{statusLabels[status]}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
