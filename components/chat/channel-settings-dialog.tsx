"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExtendedChannel } from "@/types/chat";
import { ChannelType } from "@/generated/prisma/enums";
import { Loader2, Hash, Lock, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChannelSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: ExtendedChannel;
    workspaceId: string;
    onChannelUpdated?: () => void;
}

export function ChannelSettingsDialog({
    open,
    onOpenChange,
    channel,
    workspaceId,
    onChannelUpdated,
}: ChannelSettingsDialogProps) {
    const [name, setName] = useState(channel.name);
    const [description, setDescription] = useState(channel.description || "");
    const [saving, setSaving] = useState(false);

    // Reset form when channel changes
    useEffect(() => {
        setName(channel.name);
        setDescription(channel.description || "");
    }, [channel]);

    /**
     * Handles the saving of channel information.
     *
     * This function validates the channel name, sets a saving state, and makes an asynchronous PUT request to update the channel details.
     * It handles potential errors by displaying appropriate messages and ensures the saving state is reset after the operation.
     *
     * @param {string} name - The name of the channel to be updated.
     * @param {string} description - The description of the channel to be updated.
     * @param {string} workspaceId - The ID of the workspace containing the channel.
     * @param {Object} channel - The channel object that contains the channel ID.
     * @param {Function} onChannelUpdated - Optional callback function to be called after the channel is updated.
     * @param {Function} onOpenChange - Function to change the open state of the channel.
     * @returns {Promise<void>} A promise that resolves when the save operation is complete.
     * @throws Error If the channel name is empty or if the update request fails.
     */
    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Channel name is required");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(`/api/chat/${workspaceId}/channels/${channel.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update channel");
            }

            toast.success("Channel updated successfully");
            onChannelUpdated?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating channel:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update channel");
        } finally {
            setSaving(false);
        }
    };

    const getChannelIcon = () => {
        switch (channel.type) {
            case ChannelType.PUBLIC:
                return <Hash className="h-5 w-5" />;
            case ChannelType.PRIVATE:
                return <Lock className="h-5 w-5" />;
            case ChannelType.DM:
                return <Users className="h-5 w-5" />;
        }
    };

    /**
     * Returns a badge component representing the type of the channel.
     *
     * The function checks the type of the channel and returns a corresponding
     * Badge component with the appropriate label. It handles three types of
     * channels: PUBLIC, PRIVATE, and DM (Direct Message). If the channel type
     * does not match any of these, it will return undefined.
     */
    const getChannelTypeBadge = () => {
        switch (channel.type) {
            case ChannelType.PUBLIC:
                return <Badge variant="secondary">Public</Badge>;
            case ChannelType.PRIVATE:
                return <Badge variant="secondary">Private</Badge>;
            case ChannelType.DM:
                return <Badge variant="secondary">Direct Message</Badge>;
        }
    };

    const hasChanges = name !== channel.name || description !== (channel.description || "");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {getChannelIcon()}
                        <div>
                            <DialogTitle>Channel Settings</DialogTitle>
                            <DialogDescription>
                                Manage settings for #{channel.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-6 py-4">
                        {/* General Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">General Settings</h3>

                            <div className="space-y-2">
                                <Label htmlFor="channel-name">Channel name</Label>
                                <Input
                                    id="channel-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={80}
                                    disabled={saving || channel.type === ChannelType.DM}
                                    placeholder="e.g. marketing"
                                />
                                {channel.type === ChannelType.DM && (
                                    <p className="text-muted-foreground text-xs">
                                        Direct message names cannot be changed
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="channel-description">Description</Label>
                                <Textarea
                                    id="channel-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    disabled={saving}
                                    placeholder="What's this channel about?"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Channel Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Channel Information</h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Type</span>
                                    {getChannelTypeBadge()}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Members</span>
                                    <span className="text-sm font-medium">{channel._count.members}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Messages</span>
                                    <span className="text-sm font-medium">{channel._count.messages}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Created</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {format(new Date(channel.createdAt), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Members List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Members ({channel.members.length})</h3>

                            <div className="space-y-2">
                                {channel.members.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user.image || undefined} />
                                            <AvatarFallback>
                                                {member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {member.user.name || member.user.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {member.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Close
                    </Button>
                    {channel.type !== ChannelType.DM && (
                        <Button onClick={handleSave} disabled={saving || !hasChanges}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
