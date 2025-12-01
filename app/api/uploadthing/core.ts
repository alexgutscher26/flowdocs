import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { indexFile } from "@/lib/search";
import { z } from "zod";
import prisma from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  // Chat file upload endpoint
  chatFileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "16MB", maxFileCount: 2 },
    pdf: { maxFileSize: "8MB", maxFileCount: 3 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 3 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
      maxFileCount: 3,
    },
    "application/vnd.ms-excel": { maxFileSize: "8MB", maxFileCount: 3 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "8MB",
      maxFileCount: 3,
    },
  })
    .input(z.object({ workspaceId: z.string().optional() }))
    .middleware(async (opts) => {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) throw new Error("Unauthorized");

      return {
        userId: session.user.id,
        workspaceId: opts.input?.workspaceId || "unknown",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("Primary storage (UploadThing):", file.url);

      // REDUNDANT STORAGE: Also upload to AWS S3/R2 as backup
      let backupUrl: string | null = null;
      let backupKey: string | null = null;

      try {
        // Download file from UploadThing
        const fileResponse = await fetch(file.url);
        const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

        // Upload to S3/R2 as backup
        const {
          uploadToStorage,
          sanitizeFilename,
          optimizeImage,
          generateThumbnails,
          scanFileForViruses,
        } = await import("@/lib/file-storage");

        let processedBuffer = fileBuffer;
        let width: number | undefined;
        let height: number | undefined;
        let thumbnailUrl: string | undefined;

        // Process images (optimize and generate thumbnails)
        if (file.type?.startsWith("image/") && file.type !== "image/svg+xml") {
          try {
            const optimized = await optimizeImage(fileBuffer, {
              quality: 80,
              maxWidth: 2048,
              format: "webp",
            });
            processedBuffer = optimized.buffer;
            width = optimized.width;
            height = optimized.height;

            // Generate thumbnail
            const thumbnails = await generateThumbnails(fileBuffer);
            const thumbnailKey = `thumbnails/${metadata.workspaceId}/${sanitizeFilename(file.name)}`;
            thumbnailUrl = await uploadToStorage(
              thumbnails["300"],
              thumbnailKey,
              "image/webp"
            );
            console.log("Thumbnail uploaded to backup:", thumbnailUrl);
          } catch (error) {
            console.error("Image processing failed:", error);
            // Continue with original buffer if processing fails
          }
        }

        // Upload to backup storage (S3/R2)
        backupKey = `files/${metadata.workspaceId}/${sanitizeFilename(file.name)}`;
        backupUrl = await uploadToStorage(
          processedBuffer,
          backupKey,
          file.type || "application/octet-stream"
        );
        console.log("Backup storage (S3/R2):", backupUrl);

        // Async virus scanning (don't block response)
        scanFileForViruses(fileBuffer, file.name).then(async (scanResult) => {
          await prisma.file.update({
            where: { key: file.key },
            data: {
              virusScanned: true,
              virusScanResult: scanResult.clean ? "CLEAN" : "INFECTED",
              virusScanProvider: scanResult.provider,
            },
          });

          // If infected, delete from both storages
          if (!scanResult.clean) {
            console.warn(`Infected file detected: ${file.name}`);

            // Delete from backup storage
            if (backupKey) {
              const { deleteFromStorage } = await import("@/lib/file-storage");
              await deleteFromStorage(backupKey).catch(console.error);
            }

            // Note: UploadThing files need to be deleted via their API
            // You may want to implement this based on UploadThing's deletion API

            // Delete database record
            await prisma.file.delete({ where: { key: file.key } });

            // Rollback storage usage
            const { updateStorageUsage } = await import("@/lib/file-storage");
            await updateStorageUsage(metadata.workspaceId, -file.size);
          }
        });

        // Create File record in database with both URLs
        await prisma.file.create({
          data: {
            name: file.name,
            sanitizedName: sanitizeFilename(file.name),
            key: file.key,
            url: file.url, // Primary: UploadThing URL
            backupUrl: backupUrl, // Backup: S3/R2 URL
            thumbnailUrl: thumbnailUrl,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            width,
            height,
            workspaceId: metadata.workspaceId,
            uploadedById: metadata.userId,
            virusScanned: false,
            virusScanResult: "PENDING",
          },
        });

        // Log redundant storage
        console.log(`File stored redundantly:
          - Primary: ${file.url}
          - Backup: ${backupUrl}
          - Thumbnail: ${thumbnailUrl || "N/A"}`);
      } catch (error) {
        console.error("Backup storage failed (continuing with primary):", error);

        // Even if backup fails, create the database record with primary URL
        await prisma.file.create({
          data: {
            name: file.name,
            sanitizedName: file.name,
            key: file.key,
            url: file.url,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            workspaceId: metadata.workspaceId,
            uploadedById: metadata.userId,
            virusScanned: false,
            virusScanResult: "PENDING",
          },
        });
      }

      // Update workspace storage usage
      const { updateStorageUsage } = await import("@/lib/file-storage");
      await updateStorageUsage(metadata.workspaceId, file.size);

      // Index file in Typesense
      await indexFile({
        id: file.key,
        name: file.name,
        type: file.name.split(".").pop() || "unknown",
        workspaceId: metadata.workspaceId,
        uploadedBy: metadata.userId,
        createdAt: new Date(),
        content: "", // Content extraction to be implemented
      });

      return {
        url: file.url,
        backupUrl,
        name: file.name,
        size: file.size,
        key: file.key,
      };
    }),

  // Workspace logo uploader
  workspaceLogoUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Workspace logo upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { url: file.url };
    }),

  // User profile picture uploader
  userProfileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("User profile upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
