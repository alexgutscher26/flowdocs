"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WikiEditor } from "@/components/wiki";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface NewWikiClientProps {
  workspaceId: string;
}

export function NewWikiClient({ workspaceId }: NewWikiClientProps) {
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
      const response = await fetch(`/api/wiki/${workspaceId}/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create page");
      }

      const newPage = await response.json();

      toast({
        title: "Success",
        description: "Wiki page created successfully",
      });

      // Redirect to the new page
      router.push(`/dashboard/wiki/${workspaceId}/${newPage.slug}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create wiki page",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/wiki/${workspaceId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/wiki/${workspaceId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wiki
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Wiki Page</h1>
        <p className="text-muted-foreground mt-1">Create a new page in your workspace wiki</p>
      </div>

      <WikiEditor
        initialTitle=""
        initialContent=""
        initialTags={[]}
        onSave={handleSave}
        onCancel={handleCancel}
        autoSave={false}
      />
    </div>
  );
}
