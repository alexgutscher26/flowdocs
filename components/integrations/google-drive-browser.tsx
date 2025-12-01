"use client";

import { useState, useEffect } from "react";
import { listGoogleDriveFiles } from "@/app/actions/google-drive";
import { GoogleDriveFile } from "@/lib/integrations/google-drive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, FileIcon, ImageIcon, FolderIcon } from "lucide-react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

interface GoogleDriveBrowserProps {
    onSelect?: (file: GoogleDriveFile) => void;
}

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
        <div className="flex flex-col gap-4 h-[500px]">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search Drive..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                />
            </div>

            <ScrollArea className="h-[400px] border rounded-md" type="always">
                <div className="p-4">
                    {loading && files.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
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
        </div>
    );
}
