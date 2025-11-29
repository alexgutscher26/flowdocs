"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "use-debounce";

export interface SearchFilters {
  type?: "message" | "wiki" | "file" | "user" | "all";
  channelId?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface SearchOptions {
  sortBy?: "relevance" | "date" | "author";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface SearchResult {
  results: {
    messages: any[];
    wikiPages: any[];
    files: any[];
    users: any[];
  };
  facets: {
    byType: {
      messages: number;
      wikiPages: number;
      files: number;
      users: number;
    };
    byChannel: Record<string, number>;
    byAuthor: Record<string, number>;
  };
  total: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  options: SearchOptions;
  createdAt: string;
}

const RECENT_SEARCHES_KEY = "recent-searches";
const SAVED_SEARCHES_KEY = "saved-searches";
const MAX_RECENT_SEARCHES = 10;

export function useSearch(workspaceId: string | null, enableDebounce = true) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, enableDebounce ? 300 : 0);
  const [filters, setFilters] = useState<SearchFilters>({ type: "all" });
  const [options, setOptions] = useState<SearchOptions>({
    sortBy: "relevance",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recent searches:", e);
    }
  }, []);

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved searches:", e);
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((q) => q !== searchQuery)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save recent searches:", e);
      }
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error("Failed to clear recent searches:", e);
    }
  }, []);

  // Save search query
  const saveSearch = useCallback(
    (name: string) => {
      const newSearch: SavedSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        options,
        createdAt: new Date().toISOString(),
      };

      setSavedSearches((prev) => {
        const updated = [...prev, newSearch];
        try {
          localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save search:", e);
        }
        return updated;
      });

      return newSearch;
    },
    [query, filters, options]
  );

  // Load saved search
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setOptions(savedSearch.options);
  }, []);

  // Delete saved search
  const deleteSavedSearch = useCallback((id: string) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to delete saved search:", e);
      }
      return updated;
    });
  }, []);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery || !workspaceId) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          workspaceId,
          ...(filters.type && filters.type !== "all" && { type: filters.type }),
          ...(filters.channelId && { channelId: filters.channelId }),
          ...(filters.authorId && { authorId: filters.authorId }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
          ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags.join(",") }),
          ...(options.sortBy && { sortBy: options.sortBy }),
          ...(options.sortOrder && { sortOrder: options.sortOrder }),
          ...(options.page && { page: options.page.toString() }),
          ...(options.limit && { limit: options.limit.toString() }),
        });

        const response = await fetch(`/api/search?${params}`);

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setResults(data);
        saveToRecentSearches(debouncedQuery);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, workspaceId, filters, options, saveToRecentSearches]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    options,
    setOptions,
    results,
    isLoading,
    error,
    recentSearches,
    clearRecentSearches,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
  };
}
