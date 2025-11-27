import { ArrowUpRightIcon, RocketIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Renders the empty state component for Dashboard Pro.
 */
export function DashboardProEmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RocketIcon />
        </EmptyMedia>
        <EmptyTitle>FlowDocs Pro Unlocks More</EmptyTitle>
        <EmptyDescription>
          Activate FlowDocs Pro to access advanced analytics, automation, and collaboration
          workflows across your team.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <a href="/pricing" rel="noopener noreferrer">
            Upgrade to Pro
            <ArrowUpRightIcon className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
