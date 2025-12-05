"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ExtendedMessage } from "@/types/chat";
import { getMessagePreview } from "@/lib/message-actions";
import { Loader2, Hash, Lock, MessageSquare } from "lucide-react";

interface Channel {
    id: string;
    name: string;
    type: "PUBLIC" | "PRIVATE" | "DM";
}

interface ForwardMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    message: ExtendedMessage | null;
    workspaceId: string;
    currentChannelId: string;
}

export function ForwardMessageDialog({
    open,
    onOpenChange,
    message,
    workspaceId,
    currentChannelId,
}: ForwardMessageDialogProps) {
    const { toast } = useToast();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    const [comment, setComment] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isForwarding, setIsForwarding] = useState(false);

    // Fetch channels when dialog opens
    useEffect(() => {
        if (open && workspaceId) {
            fetchChannels();
        }
    }, [open, workspaceId]);

    const fetchChannels = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/chat/${workspaceId}/channels`);
            if (response.ok) {
                const data = await response.json();
                // Filter out current channel and DMs
                const filteredChannels = data.filter(
                    (ch: Channel) => ch.id !== currentChannelId && ch.type !== "DM"
                );
                setChannels(filteredChannels);
            }
        } catch (error) {
            console.error("Error fetching channels:", error);
            toast({
                title: "Error",
                description: "Failed to load channels",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleChannel = (channelId: string) => {
        setSelectedChannelIds((prev) =>
            prev.includes(channelId)
                ? prev.filter((id) => id !== channelId)
                : [...prev, channelId]
        );
    };

    const handleForward = async () => {
        if (!message || selectedChannelIds.length === 0) return;

        setIsForwarding(true);
        try {
            const response = await fetch(
                `/api/chat/${workspaceId}/messages/${message.id}/forward`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        targetChannelIds: selectedChannelIds,
                        comment: comment.trim() || undefined,
                    }),
                }
            );

            if (response.ok) {
                toast({
                    title: "Message forwarded",
                    description: `Forwarded to ${selectedChannelIds.length} channel${selectedChannelIds.length > 1 ? "s" : ""
                        }`,
                });
                onOpenChange(false);
                // Reset state
                setSelectedChannelIds([]);
                setComment("");
                setSearchQuery("");
            } else {
                const error = await response.json();
                toast({
                    title: "Failed to forward",
                    description: error.error || "An error occurred",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error forwarding message:", error);
            toast({
                title: "Error",
                description: "Failed to forward message",
                variant: "destructive",
            });
        } finally {
            setIsForwarding(false);
        }
    };

    const filteredChannels = channels.filter((channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const messagePreview = message ? getMessagePreview(message.content, 150) : "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Forward message</DialogTitle>
                    <DialogDescription>
                        Select one or more channels to forward this message to.
                    </DialogDescription>
                </DialogHeader>

                {/* Message Preview */}
                {message && (
                    <div className="bg-muted rounded-lg border p-3">
                        <p className="text-muted-foreground mb-1 text-xs font-medium">
                            Message from {message.user.name || message.user.email}
                        </p>
                        <p className="text-sm">{messagePreview}</p>
                    </div>
                )}

                {/* Channel Search */}
                <div className="space-y-2">
                    <Label htmlFor="channel-search">Search channels</Label>
                    <Input
                        id="channel-search"
                        placeholder="Search by channel name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Channel List */}
                <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border p-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : filteredChannels.length === 0 ? (
                        <p className="text-muted-foreground py-4 text-center text-sm">
                            No channels found
                        </p>
                    ) : (
                        filteredChannels.map((channel) => (
                            <div
                                key={channel.id}
                                className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted"
                            >
                                <Checkbox
                                    id={`channel-${channel.id}`}
                                    checked={selectedChannelIds.includes(channel.id)}
                                    onCheckedChange={() => handleToggleChannel(channel.id)}
                                />
                                <label
                                    htmlFor={`channel-${channel.id}`}
                                    className="flex flex-1 cursor-pointer items-center gap-2 text-sm"
                                >
                                    {channel.type === "PRIVATE" ? (
                                        <Lock className="h-4 w-4" />
                                    ) : (
                                        <Hash className="h-4 w-4" />
                                    )}
                                    {channel.name}
                                </label>
                            </div>
                        ))
                    )}
                </div>

                {/* Optional Comment */}
                <div className="space-y-2">
                    <Label htmlFor="comment">Add a comment (optional)</Label>
                    <Textarea
                        id="comment"
                        placeholder="Add context or explanation..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isForwarding}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleForward}
                        disabled={selectedChannelIds.length === 0 || isForwarding}
                    >
                        {isForwarding ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Forwarding...
                            </>
                        ) : (
                            <>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Forward to {selectedChannelIds.length || 0} channel
                                {selectedChannelIds.length !== 1 ? "s" : ""}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
