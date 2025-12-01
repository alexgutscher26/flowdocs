import { HelpGuideLayout } from "@/components/help/help-guide-layout";

export default function TroubleshootingPage() {
  return (
    <HelpGuideLayout
      title="Troubleshooting"
      description="Solutions to common issues and how to get further assistance."
      breadcrumbs={[{ label: "Troubleshooting", href: "/dashboard/help/troubleshooting" }]}
    >
      <h2>Login Issues</h2>
      <p>If you are having trouble logging in:</p>
      <ul>
        <li>Ensure you are using the correct email address.</li>
        <li>Check your spam folder for magic link emails.</li>
        <li>Try clearing your browser cache and cookies.</li>
      </ul>

      <h2>Permission Errors</h2>
      <p>If you see a "Permission Denied" error:</p>
      <ul>
        <li>
          Verify that you have the correct role for the action you are trying to perform (e.g., only
          Editors can edit documents).
        </li>
        <li>Ask your workspace Admin to check your permissions.</li>
      </ul>

      <h2>Performance Issues</h2>
      <p>If the application feels slow:</p>
      <ul>
        <li>Check your internet connection.</li>
        <li>Ensure you are using a supported modern browser (Chrome, Firefox, Safari, Edge).</li>
        <li>Reload the page.</li>
      </ul>

      <h2>Contacting Support</h2>
      <p>If you can't find a solution here, our support team is ready to help.</p>
      <p>
        Email us at{" "}
        <a href="mailto:support@flowdocs.com" className="text-primary hover:underline">
          support@flowdocs.com
        </a>{" "}
        and we'll get back to you as soon as possible.
      </p>
    </HelpGuideLayout>
  );
}
