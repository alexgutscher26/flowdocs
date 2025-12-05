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

/**
 * Retrieve the storage configuration based on the environment variables.
 *
 * The function checks the STORAGE_PROVIDER environment variable to determine the storage type.
 * If the provider is "r2", it validates the presence of the R2_ACCOUNT_ID and constructs the configuration accordingly.
 * If the provider is not "r2", it defaults to S3 configuration using the relevant environment variables.
 *
 * @returns The storage configuration object for the specified provider.
 * @throws Error If R2_ACCOUNT_ID is not provided when the provider is "r2".
 */
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

/**
 * Validate a file's size and MIME type based on specified options.
 *
 * The function checks if the file size is within the allowed limits and validates the MIME type using magic numbers.
 * If the MIME type cannot be determined, it checks for common text file extensions.
 * The function returns an object indicating the validity of the file along with any error messages or the detected MIME type.
 *
 * @param buffer - The Buffer containing the file data to be validated.
 * @param filename - The name of the file being validated.
 * @param options - An optional object containing validation options such as allowedTypes, maxSize, and minSize.
 * @returns An object indicating whether the file is valid, any error message, and the detected MIME type if valid.
 */
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

/**
 * Sanitizes a filename by appending a timestamp and a random string.
 */
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

/**
 * Scan a file for viruses using a specified provider.
 *
 * The function checks if virus scanning is enabled via an environment variable. If enabled, it determines the scanning provider and calls the appropriate scanning function based on the provider. If an error occurs during scanning, it logs the error and returns a failure response indicating the scan failed.
 *
 * @param buffer - The buffer containing the file data to be scanned.
 * @param filename - The name of the file being scanned.
 * @returns A Promise that resolves to a VirusScanResult indicating whether the file is clean or if a threat was detected.
 */
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

/**
 * Scans a buffer for viruses using ClamAV.
 *
 * This function establishes a TCP connection to a ClamAV server, sends the buffer data for scanning,
 * and processes the response to determine if the buffer is clean or contains a threat. It handles
 * connection errors and resolves with the scan result, including threat details if applicable.
 *
 * @param {Buffer} buffer - The buffer containing the data to be scanned for viruses.
 */
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

/**
 * Uploads a buffer to storage and generates a public URL for the uploaded object.
 *
 * This function creates an S3 client and retrieves the storage configuration. It then uploads the provided buffer to the specified bucket using the given key and mimeType. Depending on the storage provider, it generates a public URL in the appropriate format for either R2 or S3.
 *
 * @param {Buffer} buffer - The data to be uploaded.
 * @param {string} key - The key under which the data will be stored.
 * @param {string} mimeType - The MIME type of the data being uploaded.
 */
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

/**
 * Deletes an object from storage using the specified key.
 */
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

/**
 * Retrieves metadata for a specified file from S3 storage.
 *
 * This function creates an S3 client and retrieves the file's metadata using the HeadObjectCommand.
 * It extracts the size, content type, and last modified date from the response, providing default values
 * if the metadata is not available. The function relies on the createS3Client and getStorageConfig
 * functions to configure the S3 client and access the correct bucket.
 *
 * @param key - The key of the file in the S3 bucket.
 */
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

/**
 * Updates the storage usage for a given workspace.
 */
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

/**
 * Upload a file to the storage after performing various validations and processing.
 *
 * This function validates the file, checks the storage quota, scans for viruses, processes the image if applicable,
 * and finally uploads the file to the storage. It also updates the storage usage and may generate a thumbnail
 * based on the provided options.
 *
 * @param buffer - The file data as a Buffer.
 * @param filename - The name of the file being uploaded.
 * @param workspaceId - The ID of the workspace where the file will be stored.
 * @param userId - The ID of the user uploading the file.
 * @param options - Optional settings for validation, image processing, and thumbnail generation.
 * @returns A promise that resolves to an UploadResult containing the file's key, URL, thumbnail URL, size, and MIME type.
 * @throws Error If the file validation fails, storage quota is exceeded, or the virus scan fails.
 */
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
