import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Handles the POST request to forward a message to specified target channels.
 *
 * This function first verifies the user's session and checks for necessary permissions, including access to the workspace and target channels. It retrieves the original message and constructs forwarded messages, which are then created in the specified channels. If any checks fail, appropriate error responses are returned.
 *
 * @param req - The NextRequest object containing the request data.
 * @param params - An object containing a Promise that resolves to an object with workspaceId and messageId.
 * @returns A JSON response indicating success or error details.
 * @throws Error If an unexpected error occurs during message forwarding.
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
        const body = await req.json();
        const { targetChannelIds, comment } = body;

        if (!targetChannelIds || !Array.isArray(targetChannelIds) || targetChannelIds.length === 0) {
            return NextResponse.json(
                { error: "Target channel IDs are required" },
                { status: 400 }
            );
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

        // Get the original message
        const originalMessage = await prisma.message.findFirst({
            where: {
                id: messageId,
                channel: {
                    workspaceId,
                },
            },
            include: {
                user: true,
            },
        });

        if (!originalMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Verify user has access to all target channels
        const targetChannels = await prisma.channel.findMany({
            where: {
                id: { in: targetChannelIds },
                workspaceId,
            },
            include: {
                members: {
                    where: {
                        userId: session.user.id,
                    },
                },
            },
        });

        if (targetChannels.length !== targetChannelIds.length) {
            return NextResponse.json(
                { error: "One or more target channels not found" },
                { status: 404 }
            );
        }

        // Check if user is a member of all target channels
        const hasAccessToAll = targetChannels.every(
            (channel) => channel.members.length > 0 || channel.type === "PUBLIC"
        );

        if (!hasAccessToAll) {
            return NextResponse.json(
                { error: "You don't have access to one or more target channels" },
                { status: 403 }
            );
        }

        // Create forwarded messages
        const forwardedMessages = await Promise.all(
            targetChannelIds.map(async (channelId) => {
                // Build the forwarded message content
                let content = `**Forwarded from <#${originalMessage.channelId}>**\n\n`;
                content += `> ${originalMessage.content.replace(/\n/g, "\n> ")}\n`;
                content += `> — ${originalMessage.user.name || originalMessage.user.email}`;

                if (comment) {
                    content += `\n\n${comment}`;
                }

                return prisma.message.create({
                    data: {
                        content,
                        channelId,
                        userId: session.user.id,
                        type: "TEXT",
                        attachments: originalMessage.attachments || undefined, // Copy attachments
                    },
                    include: {
                        user: true,
                    },
                });
            })
        );

        return NextResponse.json({
            success: true,
            forwardedMessages,
        });
    } catch (error) {
        console.error("Error forwarding message:", error);
        return NextResponse.json(
            { error: "Failed to forward message" },
            { status: 500 }
        );
    }
}
