import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import type { CurrentUser } from "@/types/user";

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
        defaultWorkspaceId: true,
        defaultWorkspace: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!user) return null;

    // Flatten the structure for the return type
    return {
      ...user,
      defaultWorkspaceSlug: user.defaultWorkspace?.slug ?? null,
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}