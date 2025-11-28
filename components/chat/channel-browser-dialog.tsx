"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExtendedChannel } from "@/types/chat";
import { ChannelType } from "@/generated/prisma/enums";
import { Hash, Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChannelBrowserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    currentUserId: string;
    onChannelJoined?: (channelId: string) => void;
}

/**
 * Renders a dialog for browsing and joining public channels in a workspace.
 *
 * This component fetches public channels from the API when opened, allows users to search through the channels,
 * and provides functionality to join a selected channel. It manages loading states and updates the channel list
 * upon joining a channel. The component also handles user membership status for each channel.
 *
 * @param open - A boolean indicating whether the dialog is open.
 * @param onOpenChange - A callback function to handle changes in the dialog's open state.
 * @param workspaceId - The ID of the workspace from which to fetch channels.
 * @param currentUserId - The ID of the current user to check membership status.
 * @param onChannelJoined - A callback function invoked when a channel is successfully joined.
 */
export function ChannelBrowserDialog({
    open,
    onOpenChange,
    workspaceId,
    currentUserId,
    onChannelJoined,
}: ChannelBrowserDialogProps) {
    const [channels, setChannels] = useState<ExtendedChannel[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);

    // Fetch all public channels
    useEffect(() => {
        if (!open) return;

        async function fetchChannels() {
            try {
                setLoading(true);
                const response = await fetch(`/api/chat/${workspaceId}/channels`);
                if (response.ok) {
                    const data = await response.json();
                    // Filter to only public channels
                    const publicChannels = data.filter((c: ExtendedChannel) => c.type === ChannelType.PUBLIC);
                    setChannels(publicChannels);
                }
            } catch (error) {
                console.error("Error fetching channels:", error);
                toast.error("Failed to load channels");
            } finally {
                setLoading(false);
            }
        }

        fetchChannels();
    }, [workspaceId, open]);

    /**
     * Handles the process of joining a chat channel.
     *
     * This function sets the joining channel ID, makes a POST request to join the specified channel,
     * and handles the response. If successful, it updates the channel list and notifies the user.
     * In case of an error, it logs the error and displays a notification. Finally, it resets the joining channel ID.
     *
     * @param channelId - The ID of the channel to join.
     * @returns Promise<void>
     */
    const handleJoin = async (channelId: string) => {
        setJoiningChannelId(channelId);
        try {
            const response = await fetch(`/api/chat/${workspaceId}/channels/${channelId}/join`, {
                method: "POST",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to join channel");
            }

            const channel = channels.find((c) => c.id === channelId);
            toast.success(`Joined #${channel?.name}!`);
            onChannelJoined?.(channelId);

            // Refresh channels to update membership status
            const refreshResponse = await fetch(`/api/chat/${workspaceId}/channels`);
            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                const publicChannels = data.filter((c: ExtendedChannel) => c.type === ChannelType.PUBLIC);
                setChannels(publicChannels);
            }
        } catch (error) {
            console.error("Error joining channel:", error);
            toast.error(error instanceof Error ? error.message : "Failed to join channel");
        } finally {
            setJoiningChannelId(null);
        }
    };

    // Filter channels by search query
    const filteredChannels = channels.filter((channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /** Checks if the current user is a member of the given channel. */
    const isUserMember = (channel: ExtendedChannel) => {
        return channel.members?.some((m) => m.userId === currentUserId) || false;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Browse Channels</DialogTitle>
                    <DialogDescription>
                        Discover and join public channels in this workspace
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        placeholder="Search channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Channels List */}
                <ScrollArea className="h-[400px] pr-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredChannels.length === 0 ? (
                        <div className="py-8 text-center">
                            <Hash className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                            <p className="text-muted-foreground text-sm">
                                {searchQuery ? "No channels found" : "No public channels available"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredChannels.map((channel) => {
                                const isMember = isUserMember(channel);
                                const isJoining = joiningChannelId === channel.id;

                                return (
                                    <div
                                        key={channel.id}
                                        className={cn(
                                            "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                                            isMember ? "bg-muted/50" : "hover:bg-muted/30"
                                        )}
                                    >
                                        <Hash className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <h4 className="font-semibold">{channel.name}</h4>
                                                {isMember && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Joined
                                                    </Badge>
                                                )}
                                            </div>
                                            {channel.description && (
                                                <p className="text-muted-foreground mb-2 text-sm line-clamp-2">
                                                    {channel.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    <span>{channel._count.members} members</span>
                                                </div>
                                                {channel.category && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {channel.category}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {!isMember && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleJoin(channel.id)}
                                                disabled={isJoining}
                                            >
                                                {isJoining && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                Join
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
