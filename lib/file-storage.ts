import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import sanitize from "sanitize-filename";
import { nanoid } from "nanoid";
import prisma from "@/lib/prisma";

// ============================================================================
// Configuration & Types
// ============================================================================

export type StorageProvider = "s3" | "r2";

export interface StorageConfig {
  provider: StorageProvider;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string; // For R2
  accountId?: string; // For R2
}

export interface FileValidationOptions {
  allowedTypes?: string[]; // MIME types
  maxSize?: number; // bytes
  minSize?: number; // bytes
}

export interface ImageProcessingOptions {
  optimize?: boolean;
  quality?: number; // 1-100
  maxWidth?: number;
  maxHeight?: number;
  format?: "webp" | "jpeg" | "png";
  stripMetadata?: boolean;
}

export interface ThumbnailOptions {
  sizes?: number[]; // widths in pixels
  format?: "webp" | "jpeg" | "png";
  quality?: number;
}

export interface UploadResult {
  key: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface VirusScanResult {
  clean: boolean;
  threat?: string;
  provider: string;
}

// ============================================================================
// Storage Client Factory
// ============================================================================

function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || "s3") as StorageProvider;

  if (provider === "r2") {
    const accountId = process.env.R2_ACCOUNT_ID;
    if (!accountId) throw new Error("R2_ACCOUNT_ID is required for R2 storage");

    return {
      provider: "r2",
      region: "auto",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      bucket: process.env.R2_BUCKET || "",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      accountId,
    };
  }

  // Default to S3
  return {
    provider: "s3",
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucket: process.env.AWS_S3_BUCKET || "",
  };
}

function createS3Client(): S3Client {
  const config = getStorageConfig();

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint && { endpoint: config.endpoint }),
  });
}

// ============================================================================
// File Validation
// ============================================================================

const DEFAULT_ALLOWED_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/csv",
  "text/markdown",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export async function validateFile(
  buffer: Buffer,
  filename: string,
  options: FileValidationOptions = {}
): Promise<{ valid: boolean; error?: string; mimeType?: string }> {
  const {
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    maxSize = parseInt(process.env.MAX_FILE_SIZE || "52428800"), // 50MB
    minSize = 1,
  } = options;

  // Check file size
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize} bytes`,
    };
  }

  if (buffer.length < minSize) {
    return {
      valid: false,
      error: `File size is below minimum required size of ${minSize} bytes`,
    };
  }

  // Validate MIME type using magic numbers
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType) {
    // For text files and some formats that don't have magic numbers
    const extension = filename.split(".").pop()?.toLowerCase();
    const textExtensions = ["txt", "csv", "md", "json", "xml"];

    if (extension && textExtensions.includes(extension)) {
      return { valid: true, mimeType: "text/plain" };
    }

    return {
      valid: false,
      error: "Unable to determine file type",
    };
  }

  if (!allowedTypes.includes(fileType.mime)) {
    return {
      valid: false,
      error: `File type ${fileType.mime} is not allowed`,
    };
  }

  return { valid: true, mimeType: fileType.mime };
}

// ============================================================================
// Filename Sanitization
// ============================================================================

export function sanitizeFilename(filename: string): string {
  const sanitized = sanitize(filename);
  const timestamp = Date.now();
  const random = nanoid(8);
  const extension = sanitized.split(".").pop();
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf("."));

  return `${nameWithoutExt}-${timestamp}-${random}.${extension}`;
}

// ============================================================================
// Image Processing
// ============================================================================

export async function optimizeImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const {
    optimize = true,
    quality = parseInt(process.env.IMAGE_QUALITY || "80"),
    maxWidth = 2048,
    maxHeight = 2048,
    format = "webp",
    stripMetadata = true,
  } = options;

  let image = sharp(buffer);

  // Get original dimensions
  const metadata = await image.metadata();
  let { width = 0, height = 0 } = metadata;

  // Resize if needed
  if (width > maxWidth || height > maxHeight) {
    image = image.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

    const resizedMetadata = await image.metadata();
    width = resizedMetadata.width || width;
    height = resizedMetadata.height || height;
  }

  // Strip metadata for privacy
  if (stripMetadata) {
    image = image.rotate(); // Auto-rotate based on EXIF
  }

  // Convert format and optimize
  if (optimize) {
    switch (format) {
      case "webp":
        image = image.webp({ quality });
        break;
      case "jpeg":
        image = image.jpeg({ quality, mozjpeg: true });
        break;
      case "png":
        image = image.png({ quality, compressionLevel: 9 });
        break;
    }
  }

  const optimizedBuffer = await image.toBuffer();

  return {
    buffer: optimizedBuffer,
    width,
    height,
  };
}

// ============================================================================
// Thumbnail Generation
// ============================================================================

export async function generateThumbnails(
  buffer: Buffer,
  options: ThumbnailOptions = {}
): Promise<{ [size: string]: Buffer }> {
  const {
    sizes = process.env.THUMBNAIL_SIZES?.split(",").map(Number) || [150, 300, 600],
    format = "webp",
    quality = 75,
  } = options;

  const thumbnails: { [size: string]: Buffer } = {};

  for (const size of sizes) {
    let thumbnail = sharp(buffer).resize(size, size, {
      fit: "cover",
      position: "center",
    });

    switch (format) {
      case "webp":
        thumbnail = thumbnail.webp({ quality });
        break;
      case "jpeg":
        thumbnail = thumbnail.jpeg({ quality });
        break;
      case "png":
        thumbnail = thumbnail.png({ quality });
        break;
    }

    thumbnails[`${size}`] = await thumbnail.toBuffer();
  }

  return thumbnails;
}

// ============================================================================
// Virus Scanning
// ============================================================================

export async function scanFileForViruses(
  buffer: Buffer,
  filename: string
): Promise<VirusScanResult> {
  const enabled = process.env.ENABLE_VIRUS_SCAN === "true";

  if (!enabled) {
    return { clean: true, provider: "disabled" };
  }

  const provider = process.env.VIRUS_SCAN_PROVIDER || "clamav";

  try {
    switch (provider) {
      case "clamav":
        return await scanWithClamAV(buffer);
      case "virustotal":
        return await scanWithVirusTotal(buffer, filename);
      default:
        console.warn(`Unknown virus scan provider: ${provider}`);
        return { clean: true, provider: "unknown" };
    }
  } catch (error) {
    console.error("Virus scan failed:", error);
    // Fail closed - reject file if scanning fails
    return {
      clean: false,
      threat: "Scan failed",
      provider,
    };
  }
}

async function scanWithClamAV(buffer: Buffer): Promise<VirusScanResult> {
  // ClamAV integration via TCP socket
  const net = await import("net");
  const host = process.env.CLAMAV_HOST || "localhost";
  const port = parseInt(process.env.CLAMAV_PORT || "3310");

  return new Promise((resolve, reject) => {
    const client = net.connect(port, host, () => {
      client.write("zINSTREAM\0");

      // Send file size and data
      const size = Buffer.alloc(4);
      size.writeUInt32BE(buffer.length, 0);
      client.write(size);
      client.write(buffer);

      // Send zero-length chunk to indicate end
      const end = Buffer.alloc(4);
      client.write(end);
    });

    let response = "";
    client.on("data", (data) => {
      response += data.toString();
    });

    client.on("end", () => {
      if (response.includes("OK")) {
        resolve({ clean: true, provider: "clamav" });
      } else {
        const threat = response.split(":").pop()?.trim() || "Unknown threat";
        resolve({ clean: false, threat, provider: "clamav" });
      }
    });

    client.on("error", (err) => {
      reject(err);
    });
  });
}

async function scanWithVirusTotal(buffer: Buffer, filename: string): Promise<VirusScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    throw new Error("VIRUSTOTAL_API_KEY is required");
  }

  // VirusTotal API integration
  const FormData = (await import("form-data")).default;
  const form = new FormData();
  form.append("file", buffer, filename);

  const uploadResponse = await fetch("https://www.virustotal.com/api/v3/files", {
    method: "POST",
    headers: {
      "x-apikey": apiKey,
    },
    body: form as any,
  });

  if (!uploadResponse.ok) {
    throw new Error("VirusTotal upload failed");
  }

  const uploadData = await uploadResponse.json();
  const analysisId = uploadData.data.id;

  // Poll for results (simplified - in production, use webhooks)
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
    headers: {
      "x-apikey": apiKey,
    },
  });

  const analysisData = await analysisResponse.json();
  const stats = analysisData.data.attributes.stats;

  if (stats.malicious > 0) {
    return {
      clean: false,
      threat: `Detected by ${stats.malicious} engines`,
      provider: "virustotal",
    };
  }

  return { clean: true, provider: "virustotal" };
}

// ============================================================================
// Storage Operations
// ============================================================================

export async function uploadToStorage(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  const client = createS3Client();
  const config = getStorageConfig();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // Generate public URL
  if (config.provider === "r2" && config.accountId) {
    // R2 public URL format
    return `https://${config.bucket}.${config.accountId}.r2.cloudflarestorage.com/${key}`;
  }

  // S3 public URL format
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

export async function deleteFromStorage(key: string): Promise<void> {
  const client = createS3Client();
  const config = getStorageConfig();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}

export async function generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = createS3Client();
  const config = getStorageConfig();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
}> {
  const client = createS3Client();
  const config = getStorageConfig();

  const response = await client.send(
    new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );

  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType || "application/octet-stream",
    lastModified: response.LastModified || new Date(),
  };
}

// ============================================================================
// Storage Quota Management
// ============================================================================

export async function checkStorageQuota(
  workspaceId: string,
  fileSize: number
): Promise<{ allowed: boolean; currentUsage: bigint; quota: bigint }> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { storageUsed: true, storageQuota: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const currentUsage = workspace.storageUsed || BigInt(0);
  const quota = workspace.storageQuota || BigInt(5368709120); // 5GB default
  const newUsage = currentUsage + BigInt(fileSize);

  return {
    allowed: newUsage <= quota,
    currentUsage,
    quota,
  };
}

export async function updateStorageUsage(workspaceId: string, sizeDelta: number): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      storageUsed: {
        increment: BigInt(sizeDelta),
      },
    },
  });
}

// ============================================================================
// High-Level Upload Function
// ============================================================================

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  workspaceId: string,
  userId: string,
  options: {
    validation?: FileValidationOptions;
    imageProcessing?: ImageProcessingOptions;
    generateThumbnail?: boolean;
  } = {}
): Promise<UploadResult> {
  // 1. Validate file
  const validation = await validateFile(buffer, filename, options.validation);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const mimeType = validation.mimeType!;

  // 2. Check storage quota
  const quotaCheck = await checkStorageQuota(workspaceId, buffer.length);
  if (!quotaCheck.allowed) {
    throw new Error(
      `Storage quota exceeded. Current: ${quotaCheck.currentUsage}, Quota: ${quotaCheck.quota}`
    );
  }

  // 3. Scan for viruses
  const scanResult = await scanFileForViruses(buffer, filename);
  if (!scanResult.clean) {
    throw new Error(`File failed virus scan: ${scanResult.threat}`);
  }

  // 4. Process image if applicable
  let processedBuffer = buffer;
  let width: number | undefined;
  let height: number | undefined;
  let thumbnailUrl: string | undefined;

  if (mimeType.startsWith("image/") && mimeType !== "image/svg+xml") {
    const processed = await optimizeImage(buffer, options.imageProcessing);
    processedBuffer = processed.buffer;
    width = processed.width;
    height = processed.height;

    // Generate thumbnail
    if (options.generateThumbnail !== false) {
      const thumbnails = await generateThumbnails(buffer);
      const thumbnailKey = `thumbnails/${sanitizeFilename(filename)}`;
      thumbnailUrl = await uploadToStorage(thumbnails["300"], thumbnailKey, "image/webp");
    }
  }

  // 5. Upload to storage
  const key = `files/${workspaceId}/${sanitizeFilename(filename)}`;
  const url = await uploadToStorage(processedBuffer, key, mimeType);

  // 6. Update storage usage
  await updateStorageUsage(workspaceId, processedBuffer.length);

  return {
    key,
    url,
    thumbnailUrl,
    size: processedBuffer.length,
    mimeType,
    width,
    height,
  };
}
