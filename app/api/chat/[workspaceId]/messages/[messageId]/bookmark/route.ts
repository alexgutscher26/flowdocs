import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Handles the POST request to save a message with an optional note.
 *
 * The function first retrieves the user session and checks for authorization. It then extracts the workspaceId and messageId from the request parameters. If a body is present, it attempts to parse the note. The function verifies the user's membership in the workspace and checks if the specified message exists. Finally, it either creates or updates a saved message in the database and returns the saved message as a JSON response.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and messageId.
 * @returns A JSON response containing the saved message or an error message.
 * @throws Error If an error occurs during the process of saving the message.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; messageId: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { workspaceId, messageId } = await params;

        // Parse body if present (note field is optional)
        let note: string | undefined;
        try {
            const body = await req.json();
            note = body.note;
        } catch {
            // No body or invalid JSON, that's okay - note is optional
            note = undefined;
        }

        // Verify user has access to the workspace
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: session.user.id,
                    workspaceId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Verify message exists and belongs to workspace
        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                channel: {
                    workspaceId,
                },
            },
        });

        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Create or update saved message
        const savedMessage = await prisma.savedMessage.upsert({
            where: {
                messageId_userId: {
                    messageId,
                    userId: session.user.id,
                },
            },
            update: {
                note,
            },
            create: {
                messageId,
                userId: session.user.id,
                note,
            },
        });

        return NextResponse.json(savedMessage);
    } catch (error) {
        console.error("Error saving message:", error);
        return NextResponse.json(
            { error: "Failed to save message" },
            { status: 500 }
        );
    }
}

/**
 * Deletes a saved message for the authenticated user.
 *
 * The function first retrieves the user's session using the provided request headers. If the user is not authenticated, it returns a 401 Unauthorized response.
 * If authenticated, it proceeds to delete the saved message associated with the provided messageId and the user's ID from the database.
 * In case of any errors during the process, it logs the error and returns a 500 response indicating failure.
 *
 * @param req - The NextRequest object containing the request information.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and messageId.
 * @returns A JSON response indicating the success of the deletion or an error message.
 * @throws Error If there is an issue during the deletion process.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; messageId: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { messageId } = await params;

        // Delete saved message
        await prisma.savedMessage.deleteMany({
            where: {
                messageId,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing saved message:", error);
        return NextResponse.json(
            { error: "Failed to remove saved message" },
            { status: 500 }
        );
    }
}

/**
 * Handles the GET request to check if a message is saved for a user.
 *
 * The function retrieves the user session from the request headers and checks if the user is authorized.
 * It then fetches the messageId from the parameters and queries the database to determine if the message
 * is saved for the authenticated user. The result is returned as a JSON response.
 *
 * @param req - The NextRequest object representing the incoming request.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and messageId.
 * @returns A JSON response indicating whether the message is saved and the saved message details.
 * @throws Error If there is an issue retrieving the session or querying the database.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; messageId: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { messageId } = await params;

        // Check if message is saved
        const savedMessage = await prisma.savedMessage.findUnique({
            where: {
                messageId_userId: {
                    messageId,
                    userId: session.user.id,
                },
            },
        });

        return NextResponse.json({ isSaved: !!savedMessage, savedMessage });
    } catch (error) {
        console.error("Error checking saved message:", error);
        return NextResponse.json(
            { error: "Failed to check saved message" },
            { status: 500 }
        );
    }
}
