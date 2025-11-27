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

  // Group channels by type
  const publicChannels = filteredChannels.filter((c) => c.type === ChannelType.PUBLIC);
  const privateChannels = filteredChannels.filter((c) => c.type === ChannelType.PRIVATE);
  const dmChannels = filteredChannels.filter((c) => c.type === ChannelType.DM);

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
          <ChannelGroup title="Public Channels" channels={publicChannels} />
          <ChannelGroup title="Private Channels" channels={privateChannels} />
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
