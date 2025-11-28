'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { useSearch } from '@/hooks/use-search';
import { SearchResultItem } from './search-result-item';
import { SearchFilters } from './search-filters';
import { Clock, FileText, Hash, MessageSquare, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchModalProps {
    workspaceId: string | null;
}

export function SearchModal({ workspaceId }: SearchModalProps) {
    const [open, setOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const router = useRouter();

    const {
        query,
        setQuery,
        filters,
        setFilters,
        results,
        isLoading,
        recentSearches,
        clearRecentSearches,
    } = useSearch(workspaceId);

    // Keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setQuery('');
            setShowFilters(false);
        }
    }, [open, setQuery]);

    const handleSelectMessage = (messageId: string, channelId: string) => {
        router.push(`/dashboard/chat/${workspaceId}/channels/${channelId}?message=${messageId}`);
        setOpen(false);
    };

    const handleSelectWikiPage = (slug: string) => {
        router.push(`/dashboard/wiki/${workspaceId}/${slug}`);
        setOpen(false);
    };

    const handleSelectFile = (fileUrl: string) => {
        window.open(fileUrl, '_blank');
        setOpen(false);
    };

    const handleSelectUser = (userId: string) => {
        router.push(`/dashboard/profile/${userId}`);
        setOpen(false);
    };

    const handleRecentSearch = (searchQuery: string) => {
        setQuery(searchQuery);
    };

    return (
        <>
            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                title="Search"
                description="Search messages, wiki pages, files, and users"
                className="max-w-3xl"
            >
                <CommandInput
                    placeholder="Search anything..."
                    value={query}
                    onValueChange={setQuery}
                />

                <div className="flex">
                    <ScrollArea className="flex-1">
                        <CommandList>
                            <CommandEmpty>
                                {isLoading ? 'Searching...' : 'No results found.'}
                            </CommandEmpty>

                            {/* Recent Searches */}
                            {!query && recentSearches.length > 0 && (
                                <CommandGroup heading="Recent Searches">
                                    {recentSearches.map((search, index) => (
                                        <CommandItem
                                            key={index}
                                            onSelect={() => handleRecentSearch(search)}
                                            className="flex items-center gap-2"
                                        >
                                            <Clock className="h-4 w-4" />
                                            <span>{search}</span>
                                        </CommandItem>
                                    ))}
                                    <CommandSeparator />
                                    <CommandItem
                                        onSelect={clearRecentSearches}
                                        className="text-muted-foreground text-xs"
                                    >
                                        Clear recent searches
                                    </CommandItem>
                                </CommandGroup>
                            )}

                            {/* Messages */}
                            {results?.results.messages && results.results.messages.length > 0 && (
                                <CommandGroup
                                    heading={
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>Messages</span>
                                            <Badge variant="secondary" className="ml-auto">
                                                {results.facets.byType.messages}
                                            </Badge>
                                        </div>
                                    }
                                >
                                    {results.results.messages.map((hit: any) => (
                                        <SearchResultItem
                                            key={hit.document.id}
                                            type="message"
                                            data={hit.document}
                                            highlight={hit.highlight}
                                            onSelect={() =>
                                                handleSelectMessage(hit.document.id, hit.document.channelId)
                                            }
                                        />
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Wiki Pages */}
                            {results?.results.wikiPages && results.results.wikiPages.length > 0 && (
                                <CommandGroup
                                    heading={
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span>Wiki Pages</span>
                                            <Badge variant="secondary" className="ml-auto">
                                                {results.facets.byType.wikiPages}
                                            </Badge>
                                        </div>
                                    }
                                >
                                    {results.results.wikiPages.map((hit: any) => (
                                        <SearchResultItem
                                            key={hit.document.id}
                                            type="wiki"
                                            data={hit.document}
                                            highlight={hit.highlight}
                                            onSelect={() => handleSelectWikiPage(hit.document.slug)}
                                        />
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Files */}
                            {results?.results.files && results.results.files.length > 0 && (
                                <CommandGroup
                                    heading={
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-4 w-4" />
                                            <span>Files</span>
                                            <Badge variant="secondary" className="ml-auto">
                                                {results.facets.byType.files}
                                            </Badge>
                                        </div>
                                    }
                                >
                                    {results.results.files.map((hit: any) => (
                                        <SearchResultItem
                                            key={hit.document.id}
                                            type="file"
                                            data={hit.document}
                                            highlight={hit.highlight}
                                            onSelect={() => handleSelectFile(hit.document.url)}
                                        />
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Users */}
                            {results?.results.users && results.results.users.length > 0 && (
                                <CommandGroup
                                    heading={
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span>Users</span>
                                            <Badge variant="secondary" className="ml-auto">
                                                {results.facets.byType.users}
                                            </Badge>
                                        </div>
                                    }
                                >
                                    {results.results.users.map((hit: any) => (
                                        <SearchResultItem
                                            key={hit.document.id}
                                            type="user"
                                            data={hit.document}
                                            highlight={hit.highlight}
                                            onSelect={() => handleSelectUser(hit.document.id)}
                                        />
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </ScrollArea>

                    {/* Filters Sidebar */}
                    {showFilters && (
                        <div className="border-l w-64">
                            <SearchFilters filters={filters} setFilters={setFilters} />
                        </div>
                    )}
                </div>

                {/* Footer with filter toggle */}
                <div className="border-t p-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                        <span>to search</span>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-xs hover:text-foreground transition-colors"
                    >
                        {showFilters ? 'Hide' : 'Show'} filters
                    </button>
                </div>
            </CommandDialog>
        </>
    );
}
