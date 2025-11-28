import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { indexFile } from "@/lib/search";

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
    .middleware(async () => {
      const session = await auth.api.getSession({ headers: await headers() });

      if (!session?.user) throw new Error("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Index file in Typesense
      await indexFile({
        id: file.key,
        name: file.name,
        type: file.name.split('.').pop() || 'unknown',
        workspaceId: 'unknown', // TODO: Pass workspaceId from client
        uploadedBy: metadata.userId,
        createdAt: new Date(),
        content: '', // Content extraction to be implemented
      });

      return { url: file.url, name: file.name, size: file.size, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
