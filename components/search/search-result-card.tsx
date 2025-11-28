'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, MessageSquare, FileText, Hash, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SearchResultCardProps {
    type: 'message' | 'wiki' | 'file' | 'user';
    data: any;
    highlight?: any;
    workspaceId: string;
}

/**
 * Renders a search result card based on the provided type and data.
 *
 * The function determines the appropriate icon, title, content, and link based on the type of the search result (message, wiki, file, or user). It utilizes helper functions to extract and format the necessary information from the data and highlight objects. The card displays the result with relevant metadata, including a timestamp and an action button or badge, depending on the type.
 *
 * @param {Object} props - The properties for the search result card.
 * @param {string} props.type - The type of the search result (message, wiki, file, or user).
 * @param {Object} props.data - The data associated with the search result.
 * @param {Object} [props.highlight] - Optional highlight data for enhanced display.
 * @param {string} props.workspaceId - The ID of the workspace for generating links.
 * @returns {JSX.Element} The rendered search result card component.
 */
export function SearchResultCard({ type, data, highlight, workspaceId }: SearchResultCardProps) {
    const getIcon = () => {
        switch (type) {
            case 'message':
                return <MessageSquare className="h-5 w-5" />;
            case 'wiki':
                return <FileText className="h-5 w-5" />;
            case 'file':
                return <Hash className="h-5 w-5" />;
            case 'user':
                return <User className="h-5 w-5" />;
        }
    };

    const getTitle = () => {
        if (type === 'wiki') {
            return highlight?.title?.snippet || data.title;
        }
        if (type === 'file') {
            return highlight?.name?.snippet || data.name;
        }
        if (type === 'user') {
            return highlight?.name?.snippet || data.name;
        }
        return 'Message';
    };

    const getContent = () => {
        if (type === 'message' || type === 'wiki') {
            return highlight?.content?.snippet || data.content?.substring(0, 200);
        }
        if (type === 'user') {
            return highlight?.email?.snippet || data.email;
        }
        if (type === 'file') {
            return `File type: ${data.type}`;
        }
        return null;
    };

    /**
     * Generate a link based on the specified type and associated data.
     *
     * The function evaluates the type and constructs a URL accordingly. It handles different cases such as 'message', 'wiki', 'file', and 'user', returning the appropriate link for each. If the type is 'file' and no URL is provided, it defaults to returning a placeholder. The function does not handle an unrecognized type.
     *
     * @returns A string representing the constructed link based on the input type and data.
     */
    const getLink = () => {
        switch (type) {
            case 'message':
                return `/dashboard/chat/${workspaceId}/channels/${data.channelId}?message=${data.id}`;
            case 'wiki':
                return `/dashboard/wiki/${workspaceId}/${data.slug}`;
            case 'file':
                return data.url || '#';
            case 'user':
                return '#'; // No profile page
        }
    };

    const date = new Date(data.createdAt);

    return (
        <Card className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start gap-3">
                <div className="mt-1">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                            className="font-medium text-lg"
                            dangerouslySetInnerHTML={{ __html: getTitle() }}
                        />
                        <Badge variant="outline" className="shrink-0">
                            {type}
                        </Badge>
                    </div>

                    {getContent() && (
                        <div
                            className="text-sm text-muted-foreground mb-3 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: getContent() || '' }}
                        />
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
                        </div>

                        {type !== 'user' ? (
                            <Button asChild size="sm" variant="outline">
                                <Link href={getLink()}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open
                                </Link>
                            </Button>
                        ) : (
                            <Badge variant="secondary" className="capitalize">
                                {data.role || 'Member'}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
