import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
