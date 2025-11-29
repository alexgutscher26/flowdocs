"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, MessageSquare, FileText, Hash, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface SearchResultCardProps {
  type: "message" | "wiki" | "file" | "user";
  data: any;
  highlight?: any;
  workspaceId: string;
}

export function SearchResultCard({ type, data, highlight, workspaceId }: SearchResultCardProps) {
  const getIcon = () => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5" />;
      case "wiki":
        return <FileText className="h-5 w-5" />;
      case "file":
        return <Hash className="h-5 w-5" />;
      case "user":
        return <User className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    if (type === "wiki") {
      return highlight?.title?.snippet || data.title;
    }
    if (type === "file") {
      return highlight?.name?.snippet || data.name;
    }
    if (type === "user") {
      return highlight?.name?.snippet || data.name;
    }
    return "Message";
  };

  const getContent = () => {
    if (type === "message" || type === "wiki") {
      return highlight?.content?.snippet || data.content?.substring(0, 200);
    }
    if (type === "user") {
      return highlight?.email?.snippet || data.email;
    }
    if (type === "file") {
      return `File type: ${data.type}`;
    }
    return null;
  };

  const getLink = () => {
    switch (type) {
      case "message":
        return `/dashboard/chat/${workspaceId}/channels/${data.channelId}?message=${data.id}`;
      case "wiki":
        return `/dashboard/wiki/${workspaceId}/${data.slug}`;
      case "file":
        return data.url || "#";
      case "user":
        return "#"; // No profile page
    }
  };

  const date = new Date(data.createdAt);

  return (
    <Card className="hover:bg-accent/50 p-4 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1">{getIcon()}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: getTitle() }} />
            <Badge variant="outline" className="shrink-0">
              {type}
            </Badge>
          </div>

          {getContent() && (
            <div
              className="text-muted-foreground mb-3 line-clamp-3 text-sm"
              dangerouslySetInnerHTML={{ __html: getContent() || "" }}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
            </div>

            {type !== "user" ? (
              <Button asChild size="sm" variant="outline">
                <Link href={getLink()}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Link>
              </Button>
            ) : (
              <Badge variant="secondary" className="capitalize">
                {data.role || "Member"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
