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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ExtendedChannel } from "@/types/chat";
import { ChannelType } from "@/generated/prisma/enums";
import { Loader2, Hash, Lock, Users, Calendar, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChannelSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: ExtendedChannel;
    workspaceId: string;
    currentUserId: string;
    onChannelUpdated?: () => void;
}

/**
 * Renders the Channel Settings dialog for managing channel properties and members.
 *
 * This component allows users to view and edit channel settings, including the channel name and description.
 * It fetches workspace users for inviting new members and handles saving changes, inviting members, and removing members.
 * The dialog also displays channel information and a list of current members, with appropriate permissions checks for admin actions.
 *
 * @param open - A boolean indicating whether the dialog is open.
 * @param onOpenChange - A function to handle changes to the dialog's open state.
 * @param channel - The channel object containing details such as name, description, and members.
 * @param workspaceId - The ID of the workspace to which the channel belongs.
 * @param currentUserId - The ID of the current user for permission checks.
 * @param onChannelUpdated - A callback function to be called when the channel is updated.
 */
export function ChannelSettingsDialog({
    open,
    onOpenChange,
    channel,
    workspaceId,
    currentUserId,
    onChannelUpdated,
}: ChannelSettingsDialogProps) {
    const [name, setName] = useState(channel.name);
    const [description, setDescription] = useState(channel.description || "");
    const [saving, setSaving] = useState(false);
    const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

    // Reset form when channel changes
    useEffect(() => {
        setName(channel.name);
        setDescription(channel.description || "");
    }, [channel]);

    // Fetch workspace users for invite functionality
    useEffect(() => {
        if (!open || channel.type !== ChannelType.PRIVATE) return;

        /**
         * Fetches the users of the current workspace.
         *
         * This asynchronous function retrieves the members of a workspace by making a fetch request to the API endpoint.
         * If the response is successful, it parses the JSON data and updates the state with the list of workspace users.
         * In case of an error during the fetch operation, it logs the error to the console.
         */
        async function fetchWorkspaceUsers() {
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}/members`);
                if (response.ok) {
                    const data = await response.json();
                    setWorkspaceUsers(data);
                }
            } catch (error) {
                console.error("Error fetching workspace users:", error);
            }
        }

        fetchWorkspaceUsers();
    }, [open, workspaceId, channel.type]);

    /**
     * Handles the saving of channel details by making an API request.
     *
     * This function first checks if the channel name is provided, displaying an error if not. It then sets a saving state to true and attempts to update the channel details via a PUT request to the API. If the response is not successful, it throws an error with the appropriate message. Upon successful update, it triggers a success notification and calls the onChannelUpdated callback. Finally, it ensures the saving state is reset regardless of the outcome.
     *
     * @param {string} name - The name of the channel to be updated.
     * @param {string} description - The description of the channel to be updated.
     * @param {string} workspaceId - The ID of the workspace containing the channel.
     * @param {Object} channel - The channel object containing the ID and other properties.
     * @param {Function} onChannelUpdated - Optional callback function to be called after the channel is updated.
     * @param {Function} onOpenChange - Function to change the open state of the channel.
     * @returns {Promise<void>} A promise that resolves when the save operation is complete.
     * @throws Error If the channel name is not provided or if the API request fails.
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

    /**
     * Handles the invitation of a member to a channel.
     *
     * This function sets the inviting state to true, then attempts to send a POST request to invite a user
     * by their userId to a specific channel within a workspace. If the request is successful, it displays a
     * success message, triggers an optional channel update, and closes the invite dialog. In case of an error,
     * it logs the error and shows an error message to the user. Finally, it resets the inviting state.
     *
     * @param userId - The ID of the user to be invited to the channel.
     */
    const handleInviteMember = async (userId: string) => {
        setInviting(true);
        try {
            const response = await fetch(`/api/chat/${workspaceId}/channels/${channel.id}/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to invite member");
            }

            toast.success("Member invited successfully");
            onChannelUpdated?.();
            setInviteOpen(false);
        } catch (error) {
            console.error("Error inviting member:", error);
            toast.error(error instanceof Error ? error.message : "Failed to invite member");
        } finally {
            setInviting(false);
        }
    };

    /**
     * Handles the removal of a member from a channel.
     *
     * This function sets the removing member ID, attempts to send a DELETE request to the server to remove the specified member,
     * and handles the response. If the removal is successful, it displays a success message and triggers the onChannelUpdated callback.
     * In case of an error, it logs the error and displays an error message. Finally, it resets the removing member ID.
     *
     * @param memberId - The ID of the member to be removed from the channel.
     */
    const handleRemoveMember = async (memberId: string) => {
        setRemovingMemberId(memberId);
        try {
            const response = await fetch(
                `/api/chat/${workspaceId}/channels/${channel.id}/members/${memberId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to remove member");
            }

            toast.success("Member removed successfully");
            onChannelUpdated?.();
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error(error instanceof Error ? error.message : "Failed to remove member");
        } finally {
            setRemovingMemberId(null);
        }
    };

    /**
     * Returns the appropriate icon component based on the channel type.
     *
     * The function checks the type of the channel and returns a corresponding icon component:
     * a hash icon for public channels, a lock icon for private channels, and a users icon for direct messages.
     * It utilizes the `ChannelType` enumeration to determine the channel type.
     */
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

    // Check if current user is admin/owner
    const currentUserMember = channel.members.find((m) => m.userId === currentUserId);
    const isChannelAdmin =
        currentUserMember?.role === "OWNER" || currentUserMember?.role === "ADMIN";

    // Get non-members for invite list
    const nonMembers = workspaceUsers.filter(
        (user) => !channel.members.some((m) => m.userId === user.userId)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {getChannelIcon()}
                        <div>
                            <DialogTitle>Channel Settings</DialogTitle>
                            <DialogDescription>Manage settings for #{channel.name}</DialogDescription>
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
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Members ({channel.members.length})</h3>
                                {channel.type === ChannelType.PRIVATE && isChannelAdmin && (
                                    <Popover open={inviteOpen} onOpenChange={setInviteOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <UserPlus className="mr-2 h-3 w-3" />
                                                Invite
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="end">
                                            <Command>
                                                <CommandInput placeholder="Search users..." />
                                                <CommandEmpty>No users found.</CommandEmpty>
                                                <CommandGroup>
                                                    <ScrollArea className="h-[200px]">
                                                        {nonMembers.map((user) => (
                                                            <CommandItem
                                                                key={user.userId}
                                                                onSelect={() => handleInviteMember(user.userId)}
                                                                disabled={inviting}
                                                            >
                                                                <Avatar className="mr-2 h-6 w-6">
                                                                    <AvatarImage src={user.user?.image || undefined} />
                                                                    <AvatarFallback>
                                                                        {user.user?.name?.charAt(0).toUpperCase() ||
                                                                            user.user?.email.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <p className="text-sm">
                                                                        {user.user?.name || user.user?.email}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {user.user?.email}
                                                                    </p>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </ScrollArea>
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>

                            <div className="space-y-2">
                                {channel.members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user.image || undefined} />
                                            <AvatarFallback>
                                                {member.user.name?.charAt(0).toUpperCase() ||
                                                    member.user.email.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {member.user.name || member.user.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {member.user.email}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {member.role}
                                        </Badge>
                                        {isChannelAdmin &&
                                            member.role !== "OWNER" &&
                                            member.userId !== currentUserId && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    disabled={removingMemberId === member.id}
                                                >
                                                    {removingMemberId === member.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <X className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            )}
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
