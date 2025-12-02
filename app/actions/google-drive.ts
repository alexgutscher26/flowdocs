"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getGoogleDriveFiles, searchGoogleDrive } from "@/lib/integrations/google-drive";
import { headers } from "next/headers";

/**
 * List files from Google Drive based on an optional query and page token.
 *
 * The function first retrieves the user's session and checks for authorization.
 * It then fetches the user's Google account details, ensuring an access token is available.
 * Finally, it calls the getGoogleDriveFiles function to retrieve the files, handling any errors that may occur during the process.
 *
 * @param query - An optional search query to filter the files.
 * @param pageToken - An optional token for pagination of results.
 * @returns A promise that resolves to the list of files from Google Drive.
 * @throws Error If the user is unauthorized, the Google account is not connected, or if fetching files fails.
 */
export async function listGoogleDriveFiles(query?: string, pageToken?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "google",
    },
  });

  if (!account || !account.accessToken) {
    console.log("Google account not found or no access token");
    throw new Error("Google account not connected");
  }

  console.log("Using access token:", account.accessToken.substring(0, 10) + "...");
  console.log("Account scopes:", account.scope);

  try {
    return await getGoogleDriveFiles(account.accessToken, query, pageToken);
  } catch (error) {
    console.error("Failed to list Google Drive files:", error);
    throw new Error("Failed to fetch files from Google Drive");
  }
}

/**
 * Checks the connection to Google Drive by verifying the user's session and account.
 *
 * This function retrieves the current user session using the auth.api.getSession method.
 * If no user is found in the session, it returns false. It then queries the database
 * for an account associated with the user and the Google provider. The function returns
 * true if an account is found, indicating a successful connection to Google Drive.
 */
export async function checkGoogleDriveConnection() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return false;
  }

  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "google",
    },
  });

  return Boolean(account);
}
