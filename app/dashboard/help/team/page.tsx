import { HelpGuideLayout } from "@/components/help/help-guide-layout";

export default function TeamPage() {
  return (
    <HelpGuideLayout
      title="Team Management"
      description="Learn how to manage your team, assign roles, and control access permissions."
      breadcrumbs={[{ label: "Team Management", href: "/dashboard/help/team" }]}
    >
      <h2>Understanding Roles</h2>
      <p>Flowdocs has three primary roles for workspace members:</p>
      <ul>
        <li>
          <strong>Admin</strong>: Full access to all workspace settings, billing, and member
          management. Can delete the workspace.
        </li>
        <li>
          <strong>Editor</strong>: Can create, edit, and delete content (documents, chats). Cannot
          manage billing or workspace settings.
        </li>
        <li>
          <strong>Viewer</strong>: Read-only access to all content. Cannot make changes.
        </li>
      </ul>

      <h2>Managing Members</h2>
      <p>As an Admin, you can manage the members of your workspace:</p>
      <h3>Changing Roles</h3>
      <ol>
        <li>
          Go to the <strong>Team</strong> page.
        </li>
        <li>Find the member you want to update.</li>
        <li>Click the dropdown menu next to their current role.</li>
        <li>Select the new role.</li>
      </ol>

      <h3>Removing Members</h3>
      <p>To remove a member from the workspace:</p>
      <ol>
        <li>
          Go to the <strong>Team</strong> page.
        </li>
        <li>
          Click the <strong>...</strong> menu next to the member's name.
        </li>
        <li>
          Select <strong>Remove Member</strong>.
        </li>
        <li>Confirm the action.</li>
      </ol>
    </HelpGuideLayout>
  );
}
