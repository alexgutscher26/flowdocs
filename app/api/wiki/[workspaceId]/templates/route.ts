import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest, props: { params: Promise<{ workspaceId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const templates = await prisma.wikiPage.findMany({
      where: {
        workspaceId: params.workspaceId,
        isTemplate: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        slug: true,
        excerpt: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[WIKI_TEMPLATES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
