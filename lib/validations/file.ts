import { z } from "zod";

// File upload validation schema
export const fileUploadSchema = z.object({
    workspaceId: z.string().cuid(),
    file: z.instanceof(File),
    generateThumbnail: z.boolean().optional().default(true),
    optimize: z.boolean().optional().default(true),
});

// File type restrictions
export const imageFileSchema = z.object({
    mimeType: z.enum([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
    ]),
    maxSize: z.number().max(10485760).optional(), // 10MB
});

export const documentFileSchema = z.object({
    mimeType: z.enum([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "text/markdown",
    ]),
    maxSize: z.number().max(52428800).optional(), // 50MB
});

export const videoFileSchema = z.object({
    mimeType: z.enum(["video/mp4", "video/webm", "video/quicktime"]),
    maxSize: z.number().max(104857600).optional(), // 100MB
});

// File metadata validation
export const fileMetadataSchema = z.object({
    id: z.string().cuid(),
    name: z.string(),
    sanitizedName: z.string(),
    key: z.string(),
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    mimeType: z.string(),
    size: z.number().int().positive(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    virusScanned: z.boolean(),
    virusScanResult: z.enum(["CLEAN", "INFECTED", "PENDING", "ERROR"]).optional(),
    virusScanProvider: z.string().optional(),
    workspaceId: z.string().cuid(),
    uploadedById: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// File deletion schema
export const fileDeleteSchema = z.object({
    fileId: z.string().cuid(),
    workspaceId: z.string().cuid(),
});

// Storage quota schema
export const storageQuotaSchema = z.object({
    workspaceId: z.string().cuid(),
    storageUsed: z.bigint(),
    storageQuota: z.bigint(),
    percentageUsed: z.number().min(0).max(100),
});

// File list query schema
export const fileListQuerySchema = z.object({
    workspaceId: z.string().cuid(),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
    type: z.enum(["image", "document", "video", "all"]).optional().default("all"),
    sortBy: z.enum(["createdAt", "size", "name"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    uploadedBy: z.string().optional(),
});

// File size limits by type
export const FILE_SIZE_LIMITS = {
    image: 10485760, // 10MB
    video: 104857600, // 100MB
    document: 52428800, // 50MB
    default: 52428800, // 50MB
} as const;

// Allowed MIME types by category
export const ALLOWED_MIME_TYPES = {
    image: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
    ],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    document: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "text/markdown",
    ],
    archive: ["application/zip", "application/x-rar-compressed"],
} as const;

export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type FileDeleteInput = z.infer<typeof fileDeleteSchema>;
export type StorageQuota = z.infer<typeof storageQuotaSchema>;
export type FileListQuery = z.infer<typeof fileListQuerySchema>;
