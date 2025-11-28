"use client";

import { useState, useEffect } from "react";
import { ExtendedChannel } from "@/types/chat";
import { ChannelType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hash, Lock, Plus, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelSidebarProps {
  workspaceId: string;
  activeChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel?: () => void;
  refreshTrigger?: number; // Used to force refresh
}

/**
 * Renders a sidebar for channel management within a workspace.
 *
 * This component fetches channels from an API based on the provided workspaceId and refreshTrigger. It filters channels based on a search query and groups them by type (public, private, direct messages) and category. The sidebar also includes functionality for selecting channels and creating new ones, while displaying loading states and handling empty channel scenarios.
 *
 * @param workspaceId - The ID of the workspace to fetch channels from.
 * @param activeChannelId - The ID of the currently active channel.
 * @param onChannelSelect - Callback function to handle channel selection.
 * @param onCreateChannel - Callback function to handle channel creation.
 * @param refreshTrigger - A trigger to refresh the channel list.
 */
export function ChannelSidebar({
  workspaceId,
  activeChannelId,
  onChannelSelect,
  onCreateChannel,
  refreshTrigger,
}: ChannelSidebarProps) {
  const [channels, setChannels] = useState<ExtendedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
  /**
   * Groups channels by their category and separates uncategorized channels.
   */
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

  const { groups: publicGroups, uncategorized: publicUncategorized } = groupChannelsByCategory(publicChannels);
  const { groups: privateGroups, uncategorized: privateUncategorized } = groupChannelsByCategory(privateChannels);

  /**
   * Returns the appropriate icon component based on the channel type.
   *
   * The function takes a ChannelType and uses a switch statement to determine
   * which icon to return. It handles three cases: PUBLIC, PRIVATE, and DM,
   * each returning a different icon component with specified class names.
   *
   * @param {ChannelType} type - The type of the channel for which to get the icon.
   */
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

  const ChannelItem = ({ channel }: { channel: ExtendedChannel }) => {
    const isActive = channel.id === activeChannelId;
    const hasUnread = (channel.unreadCount || 0) > 0;

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
        {getChannelIcon(channel.type)}
        <span className={cn("flex-1 truncate text-left", hasUnread && "font-semibold")}>
          {channel.name}
        </span>
        {hasUnread && (
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
            {channel.unreadCount}
          </Badge>
        )}
      </button>
    );
  };

  const ChannelGroup = ({ title, channels }: { title: string; channels: ExtendedChannel[] }) => {
    if (channels.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between px-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {title}
          </h3>
          <span className="text-muted-foreground text-xs">{channels.length}</span>
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
          {onCreateChannel && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCreateChannel}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
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
            <ChannelGroup key={`private-${category}`} title={`${category} (Private)`} channels={channels} />
          ))}
          <ChannelGroup title="Private Channels" channels={privateUncategorized} />

          {/* Direct Messages */}
          <ChannelGroup title="Direct Messages" channels={dmChannels} />

          {filteredChannels.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No channels found" : "No channels yet"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
