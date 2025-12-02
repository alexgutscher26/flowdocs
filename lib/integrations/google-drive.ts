import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
  iconLink: string;
}

/**
 * Retrieves files from Google Drive based on the provided query and pagination token.
 *
 * This function constructs a request to the Google Drive API using the provided accessToken for authorization.
 * It allows for an optional query to filter the files and a pageToken for pagination. If the response is successful,
 * it returns the JSON data containing the files' details. An error is thrown if the response is not ok.
 *
 * @param {string} accessToken - The OAuth 2.0 access token for authenticating the request.
 * @param {string} [query] - An optional query string to filter the files.
 * @param {string} [pageToken] - An optional token for pagination to retrieve the next set of files.
 */
export async function getGoogleDriveFiles(accessToken: string, query?: string, pageToken?: string) {
  const params = new URLSearchParams({
    q: query || "trashed = false",
    fields: "nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink)",
    pageSize: "20",
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google Drive API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Searches Google Drive for files containing the specified query.
 */
export async function searchGoogleDrive(accessToken: string, query: string) {
  const q = `name contains '${query}' and trashed = false`;
  return getGoogleDriveFiles(accessToken, q);
}
