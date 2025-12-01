"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getGoogleDriveFiles, searchGoogleDrive } from "@/lib/integrations/google-drive";
import { headers } from "next/headers";

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

  return !!account;
}
