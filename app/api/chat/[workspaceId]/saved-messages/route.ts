import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { workspaceId } = await params;

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

        // Fetch saved messages for this user in this workspace
        const savedMessages = await prisma.savedMessage.findMany({
            where: {
                userId: session.user.id,
                message: {
                    channel: {
                        workspaceId,
                    },
                },
            },
            include: {
                message: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        channel: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(savedMessages);
    } catch (error) {
        console.error("Error fetching saved messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch saved messages" },
            { status: 500 }
        );
    }
}
