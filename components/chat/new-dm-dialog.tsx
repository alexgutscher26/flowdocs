"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NewDmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    currentUserId: string;
    onDmCreated: (channelId: string) => void;
}

export function NewDmDialog({
    open,
    onOpenChange,
    workspaceId,
    currentUserId,
    onDmCreated,
}: NewDmDialogProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!open) return;

        async function fetchUsers() {
            try {
                setLoading(true);
                const response = await fetch(`/api/workspaces/${workspaceId}/members`);
                if (response.ok) {
                    const data = await response.json();
                    // Filter out current user
                    setUsers(data.filter((m: any) => m.userId !== currentUserId));
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, [open, workspaceId, currentUserId]);

    const handleSelectUser = async (targetUserId: string) => {
        setCreating(true);
        try {
            const response = await fetch(`/api/chat/${workspaceId}/dm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ targetUserId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create DM");
            }

            const channel = await response.json();
            onDmCreated(channel.id);
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating DM:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create DM");
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <Command className="rounded-none border-t">
                    <CommandInput placeholder="Search people..." />
                    <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <CommandGroup heading="Suggestions">
                                <ScrollArea className="h-[300px]">
                                    {users.map((member) => (
                                        <CommandItem
                                            key={member.userId}
                                            onSelect={() => handleSelectUser(member.userId)}
                                            disabled={creating}
                                            className="cursor-pointer"
                                        >
                                            <Avatar className="mr-2 h-8 w-8">
                                                <AvatarImage src={member.user?.image || undefined} />
                                                <AvatarFallback>
                                                    {member.user?.name?.charAt(0).toUpperCase() ||
                                                        member.user?.email.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {member.user?.name || member.user?.email}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {member.user?.email}
                                                </span>
                                            </div>
                                            {creating && (
                                                <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                                            )}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
