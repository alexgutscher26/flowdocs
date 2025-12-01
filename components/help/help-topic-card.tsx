import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { IconProps } from "@tabler/icons-react";

interface HelpTopicCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<IconProps | React.ComponentProps<LucideIcon>>;
}

export function HelpTopicCard({ title, description, href, icon: Icon }: HelpTopicCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="hover:bg-muted/50 h-full transition-colors">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
            <Icon className="size-6" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
