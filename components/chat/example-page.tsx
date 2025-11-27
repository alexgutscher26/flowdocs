/**
 * Example Chat Page
 * 
 * This is an example of how to use the ChatLayout component in your application.
 * You can copy this file and adapt it to your needs.
 */

"use client";

import { ChatLayout } from "@/components/chat";
import { useEffect, useState } from "react";

interface ChatPageProps {
    params: {
        workspaceId: string;
    };
}

export default function ChatPageExample({ params }: ChatPageProps) {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch session - replace with your auth method
    useEffect(() => {
        async function fetchSession() {
            try {
                // Replace with your actual auth check
                // const response = await fetch("/api/auth/session");
                // const data = await response.json();

                // Mock session for example
                const mockSession = {
                    user: {
                        id: "user-123",
                        name: "John Doe",
                        email: "john@example.com",
                    },
                };

                setSession(mockSession);
            } catch (error) {
                console.error("Error fetching session:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSession();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading chat...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
                    <p className="text-muted-foreground mb-4">
                        Please sign in to access the chat.
                    </p>
                    <a
                        href="/sign-in"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Sign In
                    </a>
                </div>
            </div>
        );
    }

    return (
        <ChatLayout
            workspaceId={params.workspaceId}
            userId={session.user.id}
            userName={session.user.name || session.user.email}
            onCreateChannel={() => {
                // Handle channel creation
                // You can open a dialog or navigate to a channel creation page
                console.log("Create channel clicked");
            }}
        />
    );
}
