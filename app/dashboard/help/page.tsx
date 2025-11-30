import {
  IconBook,
  IconBrandDiscord,
  IconLifebuoy,
  IconMail,
  IconMessageCircle,
  IconRocket,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { FAQSection } from "@/components/help/faq-section";
import { HelpSearch } from "@/components/help/help-search";
import { HelpTopicCard } from "@/components/help/help-topic-card";
import { Button } from "@/components/ui/button";

export default function HelpCenterPage() {
  return (
    <div className="flex flex-col items-center gap-12 p-8">
      {/* Hero Section */}
      <div className="flex w-full flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">How can we help?</h1>
        <p className="text-muted-foreground text-lg">
          Search our knowledge base or browse topics below.
        </p>
        <HelpSearch />
      </div>

      {/* Topic Grid */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <HelpTopicCard
          title="Getting Started"
          description="Learn the basics of Flowdocs and set up your first workspace."
          href="/dashboard/help/getting-started"
          icon={IconRocket}
        />
        <HelpTopicCard
          title="Account & Billing"
          description="Manage your subscription, payment methods, and account settings."
          href="/dashboard/help/account"
          icon={IconSettings}
        />
        <HelpTopicCard
          title="Team Management"
          description="Invite members, manage roles, and organize your team."
          href="/dashboard/help/team"
          icon={IconUsers}
        />
        <HelpTopicCard
          title="Features Guide"
          description="Deep dive into all the powerful features Flowdocs offers."
          href="/dashboard/help/features"
          icon={IconBook}
        />
        <HelpTopicCard
          title="Integrations"
          description="Connect Flowdocs with your favorite tools and services."
          href="/dashboard/help/integrations"
          icon={IconBrandDiscord}
        />
        <HelpTopicCard
          title="Troubleshooting"
          description="Find solutions to common issues and error messages."
          href="/dashboard/help/troubleshooting"
          icon={IconLifebuoy}
        />
      </div>

      {/* FAQ Section */}
      <FAQSection />

      {/* Contact Section */}
      <div className="bg-muted/30 flex w-full max-w-3xl flex-col items-center gap-4 rounded-xl p-8 text-center">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <IconMessageCircle className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold">Still need help?</h2>
        <p className="text-muted-foreground">
          Our support team is available 24/7 to assist you with any questions.
        </p>
        <div className="flex gap-4">
          <Button>
            <IconMail className="mr-2 size-4" />
            Contact Support
          </Button>
          <Button variant="outline">
            <IconBrandDiscord className="mr-2 size-4" />
            Join Community
          </Button>
        </div>
      </div>
    </div>
  );
}
