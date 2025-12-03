/**
 * File Failover Utility
 *
 * Handles automatic failover between primary (UploadThing) and backup (S3/R2) storage
 * for high availability file access.
 */

export interface FileWithBackup {
  url: string; // Primary URL (UploadThing)
  backupUrl?: string | null; // Backup URL (S3/R2)
  name: string;
  mimeType: string;
}

/**
 * Get the best available URL for a file with automatic failover
 *
 * @param file - File object with primary and backup URLs
 * @param preferBackup - If true, prefer backup URL over primary (useful for testing)
 * @returns Promise<string> - The working URL
 */
export async function getFileUrl(file: FileWithBackup, preferBackup = false): Promise<string> {
  const primaryUrl = file.url;
  const backupUrl = file.backupUrl;

  // If preferring backup and it exists, try backup first
  if (preferBackup && backupUrl) {
    const backupWorks = await testUrl(backupUrl);
    if (backupWorks) {
      console.log(`Using backup URL for ${file.name}`);
      return backupUrl;
    }
  }

  // Try primary URL first
  const primaryWorks = await testUrl(primaryUrl);
  if (primaryWorks) {
    return primaryUrl;
  }

  // Fallback to backup if primary fails
  if (backupUrl) {
    console.warn(`Primary URL failed for ${file.name}, using backup`);
    const backupWorks = await testUrl(backupUrl);
    if (backupWorks) {
      return backupUrl;
    }
  }

  // Both failed
  throw new Error(`File ${file.name} is unavailable from both primary and backup storage`);
}

/**
 * Test if a URL is accessible
 *
 * @param url - URL to test
 * @returns Promise<boolean> - True if URL is accessible
 */
async function testUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get multiple file URLs with failover
 * Optimized to test URLs in parallel
 *
 * @param files - Array of files with backup URLs
 * @param preferBackup - If true, prefer backup URLs
 * @returns Promise<Map<string, string>> - Map of file IDs to working URLs
 */
export async function getFileUrls(
  files: (FileWithBackup & { id: string })[],
  preferBackup = false
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  await Promise.all(
    files.map(async (file) => {
      try {
        const url = await getFileUrl(file, preferBackup);
        urlMap.set(file.id, url);
      } catch (error) {
        console.error(`Failed to get URL for file ${file.id}:`, error);
      }
    })
  );

  return urlMap;
}

/**
 * Download file with automatic failover
 *
 * @param file - File object with primary and backup URLs
 */
export async function downloadFile(file: FileWithBackup): Promise<Response> {
  const url = await getFileUrl(file);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${file.name}: ${response.statusText}`);
  }

  return response;
}

/**
 * Get file buffer with automatic failover
 *
 * @param file - File object with primary and backup URLs
 * @returns Promise<Buffer> - File data as buffer
 */
export async function getFileBuffer(file: FileWithBackup): Promise<Buffer> {
  const response = await downloadFile(file);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check health of both storage providers
 * Useful for monitoring and alerting
 *
 * @returns Promise<StorageHealth> - Health status of both providers
 */
export async function checkStorageHealth(): Promise<{
  primary: { available: boolean; latency?: number };
  backup: { available: boolean; latency?: number };
}> {
  const testFile = {
    url: process.env.NEXT_PUBLIC_APP_URL + "/logo.png", // Use a known file
    backupUrl: null,
    name: "test",
    mimeType: "image/png",
  };

  const primaryStart = Date.now();
  const primaryAvailable = await testUrl(testFile.url);
  const primaryLatency = Date.now() - primaryStart;

  // Check backup storage if configured
  let backupAvailable = false;
  let backupLatency = 0;

  const backupTestUrl = process.env.BACKUP_STORAGE_TEST_URL;
  if (backupTestUrl) {
    const backupStart = Date.now();
    backupAvailable = await testUrl(backupTestUrl);
    backupLatency = Date.now() - backupStart;
  }

  return {
    primary: {
      available: primaryAvailable,
      latency: primaryAvailable ? primaryLatency : undefined,
    },
    backup: {
      available: backupAvailable,
      latency: backupAvailable ? backupLatency : undefined,
    },
  };
}
