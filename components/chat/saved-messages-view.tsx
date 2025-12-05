"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Search, X, ExternalLink, Loader2 } from "lucide-react";
import { formatMessageTime } from "@/lib/message-utils";
import { useToast } from "@/hooks/use-toast";

interface SavedMessage {
  id: string;
  note: string | null;
  createdAt: string;
  message: {
    id: string;
    content: string;
    createdAt: string;
    channelId: string;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
    channel: {
      id: string;
      name: string;
    };
  };
}

interface SavedMessagesViewProps {
  workspaceId: string;
}

export function SavedMessagesView({ workspaceId }: SavedMessagesViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSavedMessages();
  }, [workspaceId]);

  const fetchSavedMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/${workspaceId}/saved-messages`);
      if (response.ok) {
        const data = await response.json();
        setSavedMessages(data);
      }
    } catch (error) {
      console.error("Error fetching saved messages:", error);
      toast({
        title: "Error",
        description: "Failed to load saved messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/${workspaceId}/messages/${messageId}/bookmark`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSavedMessages((prev) => prev.filter((saved) => saved.message.id !== messageId));
        toast({
          title: "Bookmark removed",
          description: "Message removed from saved items",
        });
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
    }
  };

  const handleJumpToMessage = (channelId: string, messageId: string) => {
    router.push(`/dashboard/${workspaceId}/chat/${channelId}?message=${messageId}`);
  };

  const filteredMessages = savedMessages.filter(
    (saved) =>
      saved.message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      saved.message.channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      saved.note?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Saved Messages</h1>
        </div>
        <p className="text-muted-foreground">Messages you've bookmarked for later reference</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search saved messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bookmark className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? "No saved messages match your search"
                : "You haven't saved any messages yet"}
            </p>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Use the bookmark option in message menus to save important messages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((saved) => (
            <Card key={saved.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      {saved.message.user.name || saved.message.user.email}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      in #{saved.message.channel.name} •{" "}
                      {formatMessageTime(new Date(saved.message.createdAt))}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToMessage(saved.message.channelId, saved.message.id)}
                      title="Jump to message"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBookmark(saved.message.id)}
                      title="Remove bookmark"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{saved.message.content}</p>
                {saved.note && (
                  <div className="bg-muted mt-3 rounded-md p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">Your note:</p>
                    <p className="text-sm">{saved.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
