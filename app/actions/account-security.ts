"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCurrentUser } from "./user";
import type { ActionResult } from "@/types/actions";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Change the current user's password.
 *
 * This function retrieves the current user and validates the input using changePasswordSchema. It then calls the better-auth's changePassword API with the new and current passwords. If the operation is successful, it revalidates the path to the settings dashboard. In case of errors, it handles specific error messages and returns appropriate responses.
 *
 * @param input - An object containing the new and current passwords for the user.
 * @returns A promise that resolves to an ActionResult indicating the success or failure of the password change operation.
 */
export async function changePassword(input: ChangePasswordInput): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validatedData = changePasswordSchema.parse(input);

    // Use better-auth's changePassword API
    const result = await auth.api.changePassword({
      body: {
        newPassword: validatedData.newPassword,
        currentPassword: validatedData.currentPassword,
      },
      headers: await headers(),
    });

    if (!result) {
      return { success: false, error: "Failed to change password" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error changing password:", error);

    // Handle specific better-auth errors
    if (error?.message?.includes("Invalid password")) {
      return { success: false, error: "Current password is incorrect" };
    }

    return {
      success: false,
      error: "Failed to change password. Please try again.",
    };
  }
}

/**
 * Get all connected accounts for the current user.
 *
 * This function retrieves the connected accounts associated with the currently authenticated user.
 * It first checks if the user is authenticated by calling getCurrentUser(). If the user is not found,
 * it returns an unauthorized error. If the user is authenticated, it queries the database for the user's
 * accounts, selecting relevant fields and ordering them by creation date. In case of any errors during
 * the process, it logs the error and returns a failure response.
 */
export async function getConnectedAccounts(): Promise<
  ActionResult<
    {
      id: string;
      providerId: string;
      createdAt: Date;
    }[]
  >
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const accounts = await prisma.account.findMany({
      where: { userId: currentUser.id },
      select: {
        id: true,
        providerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: accounts };
  } catch (error) {
    console.error("Error fetching connected accounts:", error);
    return {
      success: false,
      error: "Failed to load connected accounts",
    };
  }
}

/**
 * Unlink a provider account.
 *
 * This function checks if the current user is authorized, verifies that the account belongs to the user,
 * ensures that the account is not the last remaining authentication method, and then deletes the account.
 * If any checks fail, it returns an appropriate error message.
 *
 * @param accountId - The ID of the account to unlink.
 * @returns A promise that resolves to an ActionResult indicating success or failure.
 */
export async function unlinkAccount(accountId: string): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if this account belongs to the user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });

    if (!account || account.userId !== currentUser.id) {
      return { success: false, error: "Account not found" };
    }

    // Check if this is the last remaining account
    const accountCount = await prisma.account.count({
      where: { userId: currentUser.id },
    });

    if (accountCount <= 1) {
      return {
        success: false,
        error: "Cannot unlink your last authentication method",
      };
    }

    // Delete the account
    await prisma.account.delete({
      where: { id: accountId },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error unlinking account:", error);
    return {
      success: false,
      error: "Failed to unlink account. Please try again.",
    };
  }
}
