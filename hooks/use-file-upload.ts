import { useState, useCallback } from "react";
import { UploadedFile, FileUploadProgress } from "@/types/chat";
import { useUploadThing } from "@/lib/uploadthing";

export function useFileUpload(workspaceId?: string) {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const { startUpload, isUploading } = useUploadThing("chatFileUploader", {
    onClientUploadComplete: (res) => {
      console.log("Upload complete:", res);
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error);
    },
  });

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadedFile[]> => {
      // Initialize upload progress
      const initialProgress: FileUploadProgress[] = files.map((file) => ({
        file,
        progress: 0,
        status: "pending",
      }));

      setUploads(initialProgress);

      try {
        // Update status to uploading
        setUploads((prev) => prev.map((upload) => ({ ...upload, status: "uploading" as const })));

        // Upload using UploadThing with workspaceId
        const uploadedFiles = await startUpload(files, { workspaceId });

        if (!uploadedFiles) {
          throw new Error("Upload failed");
        }

        // Update status to success
        setUploads((prev) =>
          prev.map((upload, i) => ({
            ...upload,
            status: "success" as const,
            progress: 100,
            url: uploadedFiles[i]?.url,
          }))
        );

        return uploadedFiles.map((file) => ({
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type || "application/octet-stream",
          key: file.key,
        }));
      } catch (error) {
        setUploads((prev) =>
          prev.map((upload) => ({
            ...upload,
            status: "error" as const,
            error: error instanceof Error ? error.message : "Upload failed",
          }))
        );
        throw error;
      } finally {
        // Clear uploads after a delay
        setTimeout(() => {
          setUploads([]);
        }, 3000);
      }
    },
    [startUpload]
  );

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  return {
    uploads,
    uploadFiles,
    clearUploads,
    isUploading,
  };
}
