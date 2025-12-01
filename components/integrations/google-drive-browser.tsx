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
 * This component manages the state for files, loading status, search queries, and error handling. It fetches files from Google Drive based on the search query and pagination, displaying them in a scrollable area. The user can search for files, load more files, and handle connection errors gracefully. The component also provides visual feedback for loading states and errors.
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
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch files from Google Drive based on the provided query and page token.
   *
   * The function sets the loading state to true and resets any previous errors. It then attempts to retrieve files using the listGoogleDriveFiles function. If a pageToken is provided, it appends the new files to the existing list; otherwise, it replaces the current files. In case of an error, it logs the error and sets an appropriate error state based on the error message. Finally, it sets the loading state to false.
   *
   * @param query - An optional string to filter the files retrieved from Google Drive.
   * @param pageToken - An optional string for pagination to fetch the next set of files.
   */
  const fetchFiles = async (query?: string, pageToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGoogleDriveFiles(query, pageToken);
      if (pageToken) {
        setFiles((prev) => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }
      setNextPageToken(data.nextPageToken || null);
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      console.error("Error fetching Google Drive files:", errorMessage);

      if (errorMessage.includes("not connected") || errorMessage.includes("Unauthorized")) {
        setError("not_connected");
      } else {
        setError("failed");
        toast.error("Failed to load Google Drive files");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(debouncedQuery);
  }, [debouncedQuery]);

  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchFiles(debouncedQuery, nextPageToken);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return <FolderIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes("image")) return <ImageIcon className="h-5 w-5 text-purple-500" />;
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="flex flex-col gap-4">
      {error === "not_connected" ? (
        <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-center p-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Google Drive Not Connected</h3>
            <p className="text-muted-foreground mb-4">
              Please connect your Google Drive account to access your files.
            </p>
            <Link href="/dashboard/integrations">
              <Button>Go to Integrations</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              disabled={error !== null}
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-md" type="always">
            <div className="p-4">
              {loading && files.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error === "failed" ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-muted-foreground">Failed to load files</p>
                  <Button variant="outline" size="sm" onClick={() => fetchFiles(debouncedQuery)}>
                    Retry
                  </Button>
                </div>
              ) : files.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
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
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {file.mimeType}
                        </span>
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
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Load More
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                  <p>No files found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
