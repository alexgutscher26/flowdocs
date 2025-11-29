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
import { Loader2, Hash, Lock, Users, Calendar, UserPlus, X, Trash2 } from "lucide-react";
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
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Reset form when channel changes
    useEffect(() => {
        setName(channel.name);
        setDescription(channel.description || "");
    }, [channel]);

    // Fetch workspace users for invite functionality
    useEffect(() => {
        if (!open || channel.type !== ChannelType.PRIVATE) return;

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

    const handleDeleteChannel = async () => {
        setDeleting(true);
        setDeleteConfirmOpen(false);
        try {
            const response = await fetch(
                `/api/chat/${workspaceId}/channels/${channel.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete channel");
            }

            toast.success("Channel deleted successfully");
            onOpenChange(false);
            onChannelUpdated?.();
            // Navigate away from deleted channel
            window.location.href = `/dashboard/chat/${workspaceId}`;
        } catch (error) {
            console.error("Error deleting channel:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete channel");
        } finally {
            setDeleting(false);
        }
    };

    /**
     * Returns the appropriate icon component based on the channel type.
     *
     * The function checks the type of the channel and returns a corresponding icon:
     * a hash icon for public channels, a lock icon for private channels,
     * and a users icon for direct messages. It utilizes the ChannelType enumeration
     * to determine the correct icon to render.
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
        <>
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Channel</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>#{channel.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteChannel} disabled={deleting}>
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        <div className="flex w-full items-center justify-between">
                            {currentUserMember?.role === "OWNER" && channel.type !== ChannelType.DM && (
                                <Button
                                    variant="destructive"
                                    onClick={() => setDeleteConfirmOpen(true)}
                                    disabled={deleting || saving}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Channel
                                </Button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                                    Close
                                </Button>
                                {channel.type !== ChannelType.DM && (
                                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
