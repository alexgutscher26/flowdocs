import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Handles the GET request to retrieve wiki templates for a specific workspace.
 *
 * The function first awaits the parameters to extract the workspaceId. It then checks the user's session for authorization. If the user is authorized, it queries the database for wiki pages that are templates associated with the given workspaceId, returning them in a JSON format. In case of errors, it logs the error and returns an internal server error response.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @param props - An object containing a promise that resolves to the parameters, including workspaceId.
 * @returns A JSON response containing the list of wiki templates for the specified workspace.
 * @throws Error If there is an issue with the session retrieval or database query.
 */
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ workspaceId: string }> }
) {
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
