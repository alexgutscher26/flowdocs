"use client";

import { useState, useEffect } from "react";
import { ExtendedChannel } from "@/types/chat";
import { ChannelType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hash, Lock, Plus, Search, Users, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelBrowserDialog } from "./channel-browser-dialog";
import { NewDmDialog } from "./new-dm-dialog";

interface ChannelSidebarProps {
  workspaceId: string;
  activeChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel?: () => void;
  refreshTrigger?: number; // Used to force refresh
  onlineUsers?: Set<string>;
  currentUserId?: string;
}

/**
 * Render the Channel Sidebar component displaying channels for a workspace.
 *
 * This component fetches channels from an API based on the provided workspaceId and refreshTrigger.
 * It filters channels based on a search query and groups them by type (public, private, direct messages).
 * The component also handles loading states and allows users to select channels or create new ones.
 *
 * @param workspaceId - The ID of the workspace to fetch channels from.
 * @param activeChannelId - The ID of the currently active channel.
 * @param onChannelSelect - Callback function to handle channel selection.
 * @param onCreateChannel - Callback function to handle channel creation.
 * @param refreshTrigger - A trigger to refresh the channel list.
 * @param onlineUsers - A set of online user IDs for direct message channels.
 * @param currentUserId - The ID of the current user.
 */
export function ChannelSidebar({
  workspaceId,
  activeChannelId,
  onChannelSelect,
  onCreateChannel,
  refreshTrigger,
  onlineUsers,
  currentUserId,
}: ChannelSidebarProps) {
  const [channels, setChannels] = useState<ExtendedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [browserDialogOpen, setBrowserDialogOpen] = useState(false);
  const [newDmDialogOpen, setNewDmDialogOpen] = useState(false);

  // Fetch channels
  useEffect(() => {
    async function fetchChannels() {
      try {
        setLoading(true);
        const response = await fetch(`/api/chat/${workspaceId}/channels`);
        if (response.ok) {
          const data = await response.json();
          setChannels(data);
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchChannels();
  }, [workspaceId, refreshTrigger]);

  // Filter channels by search query
  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group channels by type and category
  const publicChannels = filteredChannels.filter((c) => c.type === ChannelType.PUBLIC);
  const privateChannels = filteredChannels.filter((c) => c.type === ChannelType.PRIVATE);
  const dmChannels = filteredChannels.filter((c) => c.type === ChannelType.DM);

  // Group public and private channels by category
  const groupChannelsByCategory = (channels: ExtendedChannel[]) => {
    const groups: Record<string, ExtendedChannel[]> = {};
    const uncategorized: ExtendedChannel[] = [];

    channels.forEach((channel) => {
      if (channel.category) {
        if (!groups[channel.category]) {
          groups[channel.category] = [];
        }
        groups[channel.category].push(channel);
      } else {
        uncategorized.push(channel);
      }
    });

    return { groups, uncategorized };
  };

  const { groups: publicGroups, uncategorized: publicUncategorized } =
    groupChannelsByCategory(publicChannels);
  const { groups: privateGroups, uncategorized: privateUncategorized } =
    groupChannelsByCategory(privateChannels);

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case ChannelType.PUBLIC:
        return <Hash className="h-4 w-4" />;
      case ChannelType.PRIVATE:
        return <Lock className="h-4 w-4" />;
      case ChannelType.DM:
        return <Users className="h-4 w-4" />;
    }
  };

  /**
   * Renders a button for a channel item with its status and unread count.
   *
   * The function checks if the channel is active and if there are any unread messages.
   * It also determines if the other member in a direct message channel is online.
   * The button displays the channel's name, an icon, and a badge for unread messages if applicable.
   *
   * @param channel - An object representing the channel, including its id, type, name, and unreadCount.
   * @returns A JSX element representing the channel item button.
   */
  const ChannelItem = ({ channel }: { channel: ExtendedChannel }) => {
    const isActive = channel.id === activeChannelId;
    const hasUnread = (channel.unreadCount || 0) > 0;

    let displayName = channel.name;
    let isOnline = false;

    if (channel.type === ChannelType.DM && currentUserId) {
      const otherMember = channel.members.find((m) => m.userId !== currentUserId);
      if (otherMember?.user) {
        displayName = otherMember.user.name || otherMember.user.email;
        if (onlineUsers) {
          isOnline = onlineUsers.has(otherMember.userId);
        }
      }
    }

    return (
      <button
        onClick={() => onChannelSelect(channel.id)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="relative flex items-center">
          {getChannelIcon(channel.type)}
          {isOnline && (
            <span className="absolute -right-0.5 -bottom-0.5 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-white dark:ring-zinc-950" />
          )}
        </div>
        <span className={cn("flex-1 truncate text-left", hasUnread && "font-semibold")}>
          {displayName}
        </span>
        {hasUnread && (
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
            {channel.unreadCount}
          </Badge>
        )}
      </button>
    );
  };

  const ChannelGroup = ({
    title,
    channels,
    action,
  }: {
    title: string;
    channels: ExtendedChannel[];
    action?: React.ReactNode;
  }) => {
    if (channels.length === 0 && !action) return null;

    return (
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between px-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">{channels.length}</span>
            {action}
          </div>
        </div>
        <div className="space-y-1">
          {channels.map((channel) => (
            <ChannelItem key={channel.id} channel={channel} />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-muted/30 flex w-64 items-center justify-center border-r">
        <p className="text-muted-foreground text-sm">Loading channels...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex w-64 flex-col border-r">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Channels</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setBrowserDialogOpen(true)}
              title="Browse channels"
            >
              <Compass className="h-4 w-4" />
            </Button>
            {onCreateChannel && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCreateChannel}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
      </div>

      {/* Channel list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Public Channels - Categorized */}
          {Object.entries(publicGroups).map(([category, channels]) => (
            <ChannelGroup key={`public-${category}`} title={category} channels={channels} />
          ))}
          <ChannelGroup title="Public Channels" channels={publicUncategorized} />

          {/* Private Channels - Categorized */}
          {Object.entries(privateGroups).map(([category, channels]) => (
            <ChannelGroup
              key={`private-${category}`}
              title={`${category} (Private)`}
              channels={channels}
            />
          ))}
          <ChannelGroup title="Private Channels" channels={privateUncategorized} />

          {/* Direct Messages */}
          <ChannelGroup
            title="Direct Messages"
            channels={dmChannels}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setNewDmDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            }
          />

          {filteredChannels.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No channels found" : "No channels yet"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Channel Browser Dialog */}
      {currentUserId && (
        <>
          <ChannelBrowserDialog
            open={browserDialogOpen}
            onOpenChange={setBrowserDialogOpen}
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            onChannelJoined={(channelId) => {
              onChannelSelect(channelId);
              // Trigger refresh
              setChannels([]);
              fetch(`/api/chat/${workspaceId}/channels`)
                .then((res) => res.json())
                .then((data) => setChannels(data))
                .catch((error) => console.error("Error refetching channels:", error));
            }}
          />
          <NewDmDialog
            open={newDmDialogOpen}
            onOpenChange={setNewDmDialogOpen}
            workspaceId={workspaceId}
            currentUserId={currentUserId}
            onDmCreated={(channelId) => {
              onChannelSelect(channelId);
              // Trigger refresh
              setChannels([]);
              fetch(`/api/chat/${workspaceId}/channels`)
                .then((res) => res.json())
                .then((data) => setChannels(data))
                .catch((error) => console.error("Error refetching channels:", error));
            }}
          />
        </>
      )}
    </div>
  );
}
