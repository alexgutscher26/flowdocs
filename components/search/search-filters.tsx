"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SearchFiltersProps {
  filters: {
    type?: "message" | "wiki" | "file" | "user" | "all";
    channelId?: string;
    authorId?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
  };
  setFilters: (filters: any) => void;
}

export function SearchFilters({ filters, setFilters }: SearchFiltersProps) {
  const contentTypes = [
    { value: "all", label: "All" },
    { value: "message", label: "Messages" },
    { value: "wiki", label: "Wiki Pages" },
    { value: "file", label: "Files" },
    { value: "user", label: "Users" },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div>
          <h3 className="mb-3 text-sm font-medium">Content Type</h3>
          <div className="space-y-2">
            {contentTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={type.value}
                  checked={filters.type === type.value}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters({ ...filters, type: type.value as any });
                    }
                  }}
                />
                <Label htmlFor={type.value} className="cursor-pointer text-sm font-normal">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-medium">Date Range</h3>
          <div className="space-y-2">
            <div>
              <Label htmlFor="startDate" className="text-muted-foreground text-xs">
                From
              </Label>
              <input
                id="startDate"
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={filters.startDate || ""}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-muted-foreground text-xs">
                To
              </Label>
              <input
                id="endDate"
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={filters.endDate || ""}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <button
            onClick={() =>
              setFilters({
                type: "all",
                channelId: undefined,
                authorId: undefined,
                startDate: undefined,
                endDate: undefined,
                tags: undefined,
              })
            }
            className="text-muted-foreground hover:text-foreground w-full text-left text-xs transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </div>
    </ScrollArea>
  );
}
