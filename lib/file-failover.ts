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
 * Get the best available URL for a file with automatic failover.
 *
 * This function attempts to retrieve a working URL for a file by first checking the backup URL if preferred.
 * If the backup URL is not valid or not preferred, it checks the primary URL. If both URLs fail, an error is thrown.
 *
 * @param file - File object with primary and backup URLs.
 * @param preferBackup - If true, prefer backup URL over primary (useful for testing).
 * @returns A promise that resolves to the working URL.
 * @throws Error If both primary and backup URLs are unavailable.
 */
export async function getFileUrl(
  file: FileWithBackup,
  preferBackup: boolean = false
): Promise<string> {
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
 * Test if a URL is accessible.
 *
 * This function attempts to fetch the provided URL using a HEAD request with a timeout of 5 seconds.
 * If the request is successful and the response is OK, it returns true; otherwise, it catches any errors
 * and returns false, indicating the URL is not accessible.
 *
 * @param url - URL to test.
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
 * Retrieves multiple file URLs with a failover mechanism.
 * This function tests URLs in parallel, utilizing the getFileUrl function to obtain the URL for each file.
 * If an error occurs while fetching a URL, it logs the error and continues processing the remaining files.
 * The results are returned as a Map, associating file IDs with their corresponding working URLs.
 *
 * @param files - Array of files with backup URLs, each containing an id.
 * @param preferBackup - If true, prefers backup URLs when fetching.
 */
export async function getFileUrls(
  files: (FileWithBackup & { id: string })[],
  preferBackup: boolean = false
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
 * Downloads a file with automatic failover.
 *
 * This function retrieves the appropriate URL for the file using the getFileUrl function,
 * then attempts to fetch the file from that URL. If the response is not successful,
 * it throws an error indicating the failure. The function returns the fetch response
 * containing the file data.
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
 * Retrieves the file buffer from a given FileWithBackup object.
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
 * Checks the health of both primary and backup storage providers.
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

  // For backup, you'd need a known test file in S3/R2
  // For now, we'll just return a placeholder
  const backupAvailable = false;
  const backupLatency = 0;

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
