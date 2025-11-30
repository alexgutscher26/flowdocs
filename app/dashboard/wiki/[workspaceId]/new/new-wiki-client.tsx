"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WikiEditor } from "@/components/wiki";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

interface NewWikiClientProps {
  workspaceId: string;
}

interface WikiPageNode {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  children: WikiPageNode[];
}

export function NewWikiClient({ workspaceId }: NewWikiClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  const { data: tree } = useQuery<WikiPageNode[]>({
    queryKey: ["wiki-tree", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/wiki/${workspaceId}/tree`);
      if (!res.ok) {
        throw new Error("Failed to fetch wiki tree");
      }
      return res.json();
    },
  });

  // Flatten tree for select options
  const flattenTree = (nodes: WikiPageNode[], level = 0): { id: string; title: string; level: number }[] => {
    return nodes.reduce((acc, node) => {
      acc.push({ id: node.id, title: node.title, level });
      if (node.children.length > 0) {
        acc.push(...flattenTree(node.children, level + 1));
      }
      return acc;
    }, [] as { id: string; title: string; level: number }[]);
  };

  const parentOptions = tree ? flattenTree(tree) : [];

  const handleSave = async (data: {
    title: string;
    content: string;
    tags: string[];
    published: boolean;
  }) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        parentId: parentId === "root" ? null : parentId,
      };

      const response = await fetch(`/api/wiki/${workspaceId}/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

      <div className="mb-6 max-w-md space-y-2">
        <Label>Parent Page (Optional)</Label>
        <Select
          value={parentId || "root"}
          onValueChange={(value) => setParentId(value === "root" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a parent page..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="root">No Parent (Root Level)</SelectItem>
            {parentOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span style={{ paddingLeft: `${option.level * 10}px` }}>
                  {option.title}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Select a parent page to organize this page under it.
        </p>
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
