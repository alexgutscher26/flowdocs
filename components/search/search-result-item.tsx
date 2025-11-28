'use client';

import { CommandItem } from '@/components/ui/command';
import { Calendar, Hash, MessageSquare, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SearchResultItemProps {
    type: 'message' | 'wiki' | 'file' | 'user';
    data: any;
    highlight?: any;
    onSelect: () => void;
}

export function SearchResultItem({ type, data, highlight, onSelect }: SearchResultItemProps) {
    const getIcon = () => {
        switch (type) {
            case 'message':
                return <MessageSquare className="h-4 w-4" />;
            case 'wiki':
                return <Hash className="h-4 w-4" />;
            case 'file':
                return <Hash className="h-4 w-4" />;
            case 'user':
                return <User className="h-4 w-4" />;
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
        return null;
    };

    const getContent = () => {
        if (type === 'message' || type === 'wiki') {
            return highlight?.content?.snippet || data.content?.substring(0, 100);
        }
        if (type === 'user') {
            return highlight?.email?.snippet || data.email;
        }
        return null;
    };

    const getMetadata = () => {
        if (type === 'message' || type === 'wiki' || type === 'file') {
            const date = new Date(data.createdAt);
            return (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
                </div>
            );
        }
        return null;
    };

    return (
        <CommandItem onSelect={onSelect} className="flex flex-col items-start gap-1 py-3">
            <div className="flex items-center gap-2 w-full">
                {getIcon()}
                {getTitle() && (
                    <span
                        className="font-medium flex-1"
                        dangerouslySetInnerHTML={{ __html: getTitle() || '' }}
                    />
                )}
            </div>
            {getContent() && (
                <div
                    className="text-sm text-muted-foreground line-clamp-2 pl-6"
                    dangerouslySetInnerHTML={{ __html: getContent() || '' }}
                />
            )}
            {getMetadata() && <div className="pl-6">{getMetadata()}</div>}
        </CommandItem>
    );
}
