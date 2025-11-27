"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { WikiEditor } from "@/components/wiki";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface EditWikiPageProps {
  params: Promise<{
    workspaceId: string;
    slug: string;
  }>;
}

export default function EditWikiPage({ params }: EditWikiPageProps) {
  const { workspaceId, slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [workspaceId, slug]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/wiki/${workspaceId}/${slug}`);

      if (!response.ok) {
        throw new Error("Failed to fetch page");
      }

      const data = await response.json();
      setPage(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load wiki page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <Button asChild>
          <Link href={`/dashboard/wiki/${workspaceId}`}>Back to Wiki</Link>
        </Button>
      </div>
    );
  }

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
