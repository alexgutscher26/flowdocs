import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRecentPages, logPageVisit } from "@/lib/wiki-service";
import { z } from "zod";

const logVisitSchema = z.object({
    pageId: z.string(),
});

/**
 * Handles the GET request to retrieve recent pages for a specific workspace.
 *
 * The function first resolves the workspaceId from the props, then retrieves the user session using the auth API.
 * If the user is not authenticated, it returns a 401 Unauthorized response. If authenticated, it fetches the recent pages
 * for the given workspaceId and returns them as a JSON response. In case of any errors, it logs the error and returns a
 * 500 Internal Error response.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @param props - An object containing a promise that resolves to the parameters, including workspaceId.
 * @returns A JSON response containing the recent pages for the specified workspace.
 * @throws Error If there is an issue retrieving the session or recent pages.
 */
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ workspaceId: string }> }
) {
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

/**
 * Handles the POST request for logging page visits.
 *
 * This function retrieves the workspace ID from the request parameters and checks the user's session for authorization.
 * It then parses the request body using a schema and logs the page visit.
 * If any errors occur during this process, appropriate responses are returned based on the error type.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @param props - An object containing a promise that resolves to the parameters, including workspaceId.
 * @returns A NextResponse indicating the result of the operation.
 * @throws NextResponse If the user is unauthorized, if the request data is invalid, or if an internal error occurs.
 */
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ workspaceId: string }> }
) {
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
