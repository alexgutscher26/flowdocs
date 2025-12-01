import Link from "next/link";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface HelpGuideLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  breadcrumbs?: { label: string; href: string }[];
}

export function HelpGuideLayout({
  title,
  description,
  children,
  breadcrumbs = [],
}: HelpGuideLayoutProps) {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
          <Link href="/dashboard/help" className="hover:text-foreground transition-colors">
            Help Center
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              <IconChevronRight className="size-4" />
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            </div>
          ))}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2 text-lg">{description}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/help">
              <IconArrowLeft className="mr-2 size-4" />
              Back to Help
            </Link>
          </Button>
        </div>
      </div>
      <div className="prose prose-gray dark:prose-invert max-w-none">{children}</div>
    </div>
  );
}
