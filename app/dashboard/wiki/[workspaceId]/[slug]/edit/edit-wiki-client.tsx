"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WikiEditor } from "@/components/wiki";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface EditWikiClientProps {
    workspaceId: string;
    slug: string;
    page: any; // Using any to match previous implementation, but should ideally be typed
}

/**
 * Edit a wiki page within a specified workspace.
 *
 * This function manages the editing of a wiki page by providing a save and cancel functionality. It utilizes the useRouter hook for navigation and the useToast hook for displaying notifications. The handleSave function sends a PUT request to update the wiki page and handles the response, while handleCancel redirects the user back to the page view. The component also initializes the wiki editor with the current page's title, content, and tags.
 *
 * @param workspaceId - The ID of the workspace containing the wiki.
 * @param slug - The unique identifier for the wiki page.
 * @param page - The current page data including title, content, and tags.
 * @returns A JSX element representing the edit wiki client interface.
 */
export function EditWikiClient({ workspaceId, slug, page }: EditWikiClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);

    /**
     * Handles the saving of wiki page data.
     *
     * This function sets a saving state, attempts to send a PUT request to update the wiki page with the provided data,
     * and manages the response. If the request is successful, it displays a success message and redirects to the view page.
     * In case of an error, it shows an error message. The saving state is reset in the finally block.
     *
     * @param data - An object containing the title, content, tags, and published status of the wiki page.
     */
    const handleSave = async (data: {
        title: string;
        content: string;
        tags: string[];
        published: boolean;
    }) => {
        setSaving(true);
        try {
            const response = await fetch(`/api/wiki/${workspaceId}/${slug}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                    changeNote: "Updated via editor",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save page");
            }

            toast({
                title: "Success",
                description: "Wiki page updated successfully",
            });

            // Redirect to view page
            router.push(`/dashboard/wiki/${workspaceId}/${slug}`);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save wiki page",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    /**
     * Navigates to the specified wiki page in the dashboard.
     */
    const handleCancel = () => {
        router.push(`/dashboard/wiki/${workspaceId}/${slug}`);
    };

    const tags = page.tags?.map((t: any) => t.tag?.name || t.name) || [];

    return (
        <div className="p-6">
            <div className="mb-6">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/wiki/${workspaceId}/${slug}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Page
                    </Link>
                </Button>
            </div>

            <WikiEditor
                initialTitle={page.title}
                initialContent={page.content}
                initialTags={tags}
                onSave={handleSave}
                onCancel={handleCancel}
                autoSave={false}
            />
        </div>
    );
}
