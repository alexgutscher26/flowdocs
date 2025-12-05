import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRecentPages, logPageVisit } from "@/lib/wiki-service";
import { z } from "zod";

const logVisitSchema = z.object({
  pageId: z.string(),
});

export async function GET(req: NextRequest, props: { params: Promise<{ workspaceId: string }> }) {
  const params = await props.params;
  console.log("[DEBUG_RECENT_GET] Params resolved:", params);
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const recent = await getRecentPages(params.workspaceId, session.user.id);
    console.log("[DEBUG_RECENT_GET] Recent pages found:", recent.length);
    return NextResponse.json(recent);
  } catch (error) {
    console.error("[WIKI_RECENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ workspaceId: string }> }) {
  const params = await props.params;
  console.log("[DEBUG_RECENT_POST] Params resolved:", params);
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = logVisitSchema.parse(json);
    console.log("[DEBUG_RECENT_POST] Logging visit for:", body.pageId);

    await logPageVisit(params.workspaceId, session.user.id, body.pageId);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[WIKI_RECENT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
