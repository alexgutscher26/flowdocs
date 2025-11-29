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

export function EditWikiClient({ workspaceId, slug, page }: EditWikiClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

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
