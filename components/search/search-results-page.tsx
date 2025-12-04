"use client";

import { useSearch } from "@/hooks/use-search";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchFilters as SearchFiltersComponent } from "./search-filters";
import { Download, Save, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedSearches } from "./saved-searches";
import { SearchResultCard } from "./search-result-card";

interface SearchResultsPageProps {
  workspaceId: string;
}

export function SearchResultsPage({ workspaceId }: SearchResultsPageProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");

  // URL state management
  const [urlQuery, setUrlQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [urlType, setUrlType] = useQueryState("type", parseAsString.withDefault("all"));
  const [urlSortBy, setUrlSortBy] = useQueryState("sortBy", parseAsString.withDefault("relevance"));
  const [urlPage, setUrlPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const {
    query,
    setQuery,
    filters,
    setFilters,
    options,
    setOptions,
    results,
    isLoading,
    error,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
  } = useSearch(workspaceId, false);

  // Sync URL state with search state
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setUrlQuery(value || null);
  };

  const handleTypeChange = (value: string) => {
    setFilters({ ...filters, type: value as any });
    setUrlType(value);
  };

  const handleSortChange = (value: string) => {
    setOptions({ ...options, sortBy: value as any });
    setUrlSortBy(value);
  };

  const handlePageChange = (page: number) => {
    setOptions({ ...options, page });
    setUrlPage(page);
  };

  // Export functionality
  const exportResults = (format: "json" | "csv") => {
    if (!results) return;

    const allResults = [
      ...results.results.messages.map((hit: any) => ({
        type: "message",
        ...hit.document,
      })),
      ...results.results.wikiPages.map((hit: any) => ({
        type: "wiki",
        ...hit.document,
      })),
      ...results.results.files.map((hit: any) => ({
        type: "file",
        ...hit.document,
      })),
      ...results.results.users.map((hit: any) => ({
        type: "user",
        ...hit.document,
      })),
    ];

    if (format === "json") {
      const blob = new Blob([JSON.stringify(allResults, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `search-results-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export
      const headers = ["Type", "ID", "Content", "Created At"];
      const rows = allResults.map((item) => [
        item.type,
        item.id,
        item.content || item.title || item.name || item.email,
        new Date(item.createdAt).toISOString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `search-results-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    saveSearch(searchName);
    setSearchName("");
    setSaveDialogOpen(false);
  };

  return (
    <div className="flex h-full">
      {/* Saved Searches Sidebar */}
      {showSavedSearches && (
        <div className="w-64 border-r p-4">
          <SavedSearches
            searches={savedSearches}
            onLoad={loadSavedSearch}
            onDelete={deleteSavedSearch}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Search Header */}
        <div className="space-y-4 border-b p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search anything..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={urlType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="wiki">Wiki Pages</SelectItem>
                  <SelectItem value="file">Files</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>

              <Select value={urlSortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date (Newest)</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>

              {results && (
                <Badge variant="secondary">
                  {results.total} result{results.total !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
                disabled={!query}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportResults("json")}
                disabled={!results}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportResults("csv")}
                disabled={!results}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Results */}
          <ScrollArea className="flex-1 p-4">
            {isLoading && (
              <div className="text-muted-foreground py-8 text-center">Searching...</div>
            )}

            {error && <div className="text-destructive py-8 text-center">Error: {error}</div>}

            {!query && !isLoading && (
              <div className="space-y-4 py-12 text-center">
                <div className="text-muted-foreground">
                  <h3 className="mb-2 text-lg font-semibold">Start searching</h3>
                  <p className="text-sm">
                    Enter a search query above to find messages, wiki pages, files, and users
                  </p>
                </div>
                <div className="text-muted-foreground mx-auto max-w-md space-y-2 text-xs">
                  <p className="font-medium">Search tips:</p>
                  <ul className="space-y-1 text-left">
                    <li>• Use the filters to narrow down results by type, date, or author</li>
                    <li>• Sort results by relevance, date, or author</li>
                    <li>• Export results as JSON or CSV</li>
                    <li>• Save frequently used searches for quick access</li>
                  </ul>
                </div>
              </div>
            )}

            {results && !isLoading && results.total === 0 && (
              <div className="space-y-2 py-12 text-center">
                <h3 className="text-lg font-semibold">No results found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your search query or filters
                </p>
              </div>
            )}

            {results && !isLoading && results.total > 0 && (
              <div className="space-y-6">
                {/* Messages */}
                {results.results.messages.length > 0 && (
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      Messages
                      <Badge variant="secondary">{results.facets.byType.messages}</Badge>
                    </h2>
                    <div className="space-y-2">
                      {results.results.messages.map((hit: any) => (
                        <SearchResultCard
                          key={hit.document.id}
                          type="message"
                          data={hit.document}
                          highlight={hit.highlight}
                          workspaceId={workspaceId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Wiki Pages */}
                {results.results.wikiPages.length > 0 && (
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      Wiki Pages
                      <Badge variant="secondary">{results.facets.byType.wikiPages}</Badge>
                    </h2>
                    <div className="space-y-2">
                      {results.results.wikiPages.map((hit: any) => (
                        <SearchResultCard
                          key={hit.document.id}
                          type="wiki"
                          data={hit.document}
                          highlight={hit.highlight}
                          workspaceId={workspaceId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {results.results.files.length > 0 && (
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      Files
                      <Badge variant="secondary">{results.facets.byType.files}</Badge>
                    </h2>
                    <div className="space-y-2">
                      {results.results.files.map((hit: any) => (
                        <SearchResultCard
                          key={hit.document.id}
                          type="file"
                          data={hit.document}
                          highlight={hit.highlight}
                          workspaceId={workspaceId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {results.results.users.length > 0 && (
                  <div>
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                      Users
                      <Badge variant="secondary">{results.facets.byType.users}</Badge>
                    </h2>
                    <div className="space-y-2">
                      {results.results.users.map((hit: any) => (
                        <SearchResultCard
                          key={hit.document.id}
                          type="user"
                          data={hit.document}
                          highlight={hit.highlight}
                          workspaceId={workspaceId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 border-l">
              <SearchFiltersComponent filters={filters} setFilters={setFilters} />
            </div>
          )}
        </div>
      </div>

      {/* Save Search Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background w-96 rounded-lg p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Save Search</h3>
            <Input
              placeholder="Search name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
