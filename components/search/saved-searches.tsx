'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SavedSearch } from '@/hooks/use-search';

interface SavedSearchesProps {
    searches: SavedSearch[];
    onLoad: (search: SavedSearch) => void;
    onDelete: (id: string) => void;
}

export function SavedSearches({ searches, onLoad, onDelete }: SavedSearchesProps) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm">Saved Searches</h3>

            {searches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved searches yet</p>
            ) : (
                <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-2">
                        {searches.map((search) => (
                            <div
                                key={search.id}
                                className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{search.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {search.query}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() => onDelete(search.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(search.createdAt), { addSuffix: true })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7"
                                        onClick={() => onLoad(search)}
                                    >
                                        <Search className="h-3 w-3 mr-1" />
                                        Load
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
