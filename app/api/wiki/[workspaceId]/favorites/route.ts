import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getFavoritePages, toggleFavoritePage } from "@/lib/wiki-service";
import { z } from "zod";

const toggleFavoriteSchema = z.object({
  pageId: z.string(),
});

/**
 * Handles the GET request to retrieve favorite pages for a specific workspace.
 *
 * The function first awaits the parameters to extract the workspaceId. It then attempts to get the user session using the auth.api.getSession method. If the user is not authenticated, it returns a 401 Unauthorized response. If authenticated, it retrieves the favorite pages for the given workspaceId and user ID, returning the results as a JSON response. In case of any errors, it logs the error and returns a 500 Internal Error response.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @param props - An object containing a promise that resolves to the parameters, including workspaceId.
 * @returns A JSON response containing the favorite pages or an error response.
 * @throws Error If there is an issue retrieving the session or favorite pages.
 */
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
