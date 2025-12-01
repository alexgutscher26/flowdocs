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

export async function searchGoogleDrive(accessToken: string, query: string) {
  const q = `name contains '${query}' and trashed = false`;
  return getGoogleDriveFiles(accessToken, q);
}
