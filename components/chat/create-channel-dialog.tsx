"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelType } from "@/generated/prisma/enums";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onChannelCreated?: (channelId: string) => void;
}

/**
 * Create a dialog for creating a new channel.
 *
 * This function manages the state for the channel's name, description, category, and type. It handles the creation process by sending a POST request to the server with the channel details. If the creation is successful, it resets the form and notifies the parent component. Error handling is included to manage any issues during the request.
 *
 * @param open - A boolean indicating whether the dialog is open.
 * @param onOpenChange - A function to handle changes to the dialog's open state.
 * @param workspaceId - The ID of the workspace where the channel will be created.
 * @param onChannelCreated - A callback function that is called when a channel is successfully created.
 */
export function CreateChannelDialog({
  open,
  onOpenChange,
  workspaceId,
  onChannelCreated,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<ChannelType>(ChannelType.PUBLIC);
  const [creating, setCreating] = useState(false);

  /**
   * Handles the creation of a new chat channel.
   *
   * This function validates the channel name, sets the creating state, and makes a POST request to the API to create the channel.
   * It processes the response, handles errors, and resets the form fields upon successful creation.
   * Additionally, it notifies the parent component of the newly created channel.
   *
   * @param {string} name - The name of the channel to be created.
   * @param {string} description - The description of the channel (optional).
   * @param {string} category - The category of the channel (optional).
   * @param {ChannelType} type - The type of the channel.
   * @param {function} onOpenChange - A function to handle the open state change.
   * @param {function} onChannelCreated - A callback function invoked with the new channel's ID upon successful creation.
   * @returns {Promise<void>} A promise that resolves when the channel creation process is complete.
   * @throws Error If the channel creation fails due to an invalid response or other issues.
   */
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`/api/chat/${workspaceId}/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create channel");
      }

      const channel = await response.json();
      toast.success(`Channel #${channel.name} created!`);

      // Reset form
      setName("");
      setDescription("");
      setCategory("");
      setType(ChannelType.PUBLIC);
      onOpenChange(false);

      // Notify parent
      onChannelCreated?.(channel.id);
    } catch (error) {
      console.error("Error creating channel:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create channel");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>
            Channels are where your team communicates. They're best when organized around a topic —
            #marketing, for example.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel name *</Label>
            <Input
              id="name"
              placeholder="e.g. marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              disabled={creating}
            />
            <p className="text-muted-foreground text-xs">
              Names must be lowercase, without spaces, and can contain dashes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              placeholder="e.g. Projects, Teams, Random"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={50}
              disabled={creating}
            />
            <p className="text-muted-foreground text-xs">
              Group related channels together in the sidebar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Visibility</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as ChannelType)}
              disabled={creating}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ChannelType.PUBLIC}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Public</span>
                    <span className="text-muted-foreground text-xs">
                      Anyone in the workspace can see and join
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value={ChannelType.PRIVATE}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Private</span>
                    <span className="text-muted-foreground text-xs">
                      Only specific people can access
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setName("");
              setDescription("");
              setCategory("");
              setType(ChannelType.PUBLIC);
              onOpenChange(false);
            }}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
