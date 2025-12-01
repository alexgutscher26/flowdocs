"use client";

import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";

export function HelpSearch() {
  return (
    <div className="relative w-full max-w-md">
      <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input type="search" placeholder="Search for help..." className="pl-10" />
    </div>
  );
}
