import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getFavoritePages, toggleFavoritePage } from "@/lib/wiki-service";
import { z } from "zod";

const toggleFavoriteSchema = z.object({
  pageId: z.string(),
});

export async function GET(req: NextRequest, props: { params: Promise<{ workspaceId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const favorites = await getFavoritePages(params.workspaceId, session.user.id);
    return NextResponse.json(favorites);
  } catch (error) {
    console.error("[WIKI_FAVORITES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ workspaceId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = toggleFavoriteSchema.parse(json);

    const result = await toggleFavoritePage(params.workspaceId, session.user.id, body.pageId);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[WIKI_FAVORITES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
