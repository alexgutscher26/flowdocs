import { HelpGuideLayout } from "@/components/help/help-guide-layout";

/**
 * Renders the Integrations page with available integration options.
 */
export default function IntegrationsPage() {
  return (
    <HelpGuideLayout
      title="Integrations"
      description="Connect Flowdocs with your favorite tools to streamline your workflow."
      breadcrumbs={[{ label: "Integrations", href: "/dashboard/help/integrations" }]}
    >
      <h2>Slack Integration</h2>
      <p>
        Connect Flowdocs to Slack to receive notifications about new documents, comments, and
        mentions directly in your Slack channels.
      </p>
      <p>
        <em>Coming soon...</em>
      </p>

      <h2>GitHub Integration</h2>
      <p>
        Link your GitHub repositories to reference issues and pull requests directly within your
        Flowdocs documents.
      </p>
      <p>
        <em>Coming soon...</em>
      </p>

      <h2>Google Drive</h2>
      <p>
        Embed Google Docs, Sheets, and Slides directly into your wiki pages for seamless viewing.
      </p>
      <p>
        <em>Coming soon...</em>
      </p>

      <div className="bg-muted mt-8 rounded-lg p-4">
        <p className="text-sm">
          <strong>Note:</strong> We are actively working on adding more integrations. If you have a
          specific request, please contact our support team!
        </p>
      </div>
    </HelpGuideLayout>
  );
}
