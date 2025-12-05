"use client";

import * as React from "react";
import { WikiNavigation } from "./wiki-navigation";

interface WikiSidebarProps {
  workspaceId: string;
}

export function WikiSidebar({ workspaceId }: WikiSidebarProps) {
  return <WikiNavigation workspaceId={workspaceId} />;
}
