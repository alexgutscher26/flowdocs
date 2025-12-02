"use client";

import { useState, useEffect } from "react";
import { listGoogleDriveFiles } from "@/app/actions/google-drive";
import { GoogleDriveFile } from "@/lib/integrations/google-drive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, FileIcon, ImageIcon, FolderIcon, AlertCircle } from "lucide-react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import Link from "next/link";

interface GoogleDriveBrowserProps {
  onSelect?: (file: GoogleDriveFile) => void;
}

/**
 * Renders a Google Drive file browser component.
 *
 * This component manages the state for files, loading status, and search queries. It fetches files from Google Drive based on the search query and handles pagination. The user can select files, and the component displays appropriate icons based on the file type. It also includes a search input and a load more button for additional files.
 *
 * @param {GoogleDriveBrowserProps} props - The properties for the GoogleDriveBrowser component.
 * @param {function} props.onSelect - Callback function to handle file selection.
 */
export function GoogleDriveBrowser({ onSelect }: GoogleDriveBrowserProps) {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const fetchFiles = async (query?: string, pageToken?: string) => {
    setLoading(true);
    try {
      const data = await listGoogleDriveFiles(query, pageToken);
      if (pageToken) {
        setFiles((prev) => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }
      setNextPageToken(data.nextPageToken || null);
    } catch (error) {
      toast.error("Failed to load Google Drive files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(debouncedQuery);
  }, [debouncedQuery]);

  /**
   * Handles loading more files if a next page token is available.
   */
  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchFiles(debouncedQuery, nextPageToken);
    }
  };

  /**
   * Returns the appropriate file icon based on the given MIME type.
   *
   * The function checks if the mimeType indicates a folder or an image and returns the corresponding icon component.
   * If neither condition is met, it defaults to returning a generic file icon.
   * This allows for a visual representation of different file types in the UI.
   *
   * @param mimeType - The MIME type of the file to determine the icon for.
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return <FolderIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes("image")) return <ImageIcon className="h-5 w-5 text-purple-500" />;
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="flex h-[500px] flex-col gap-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input
          placeholder="Search Drive..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-[400px] rounded-md border" type="always">
        <div className="p-4">
          {loading && files.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : files.length > 0 ? (
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors"
                  onClick={() => onSelect?.(file)}
                >
                  {file.thumbnailLink ? (
                    <img
                      src={file.thumbnailLink}
                      alt={file.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    getFileIcon(file.mimeType)
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium">{file.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{file.mimeType}</span>
                  </div>
                </div>
              ))}
              {nextPageToken && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="mt-2 w-full"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Load More
                </Button>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-full min-h-[200px] flex-col items-center justify-center">
              <p>No files found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
