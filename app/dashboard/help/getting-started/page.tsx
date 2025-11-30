import { HelpGuideLayout } from "@/components/help/help-guide-layout";

/**
 * Renders the Getting Started page with guidance on using Flowdocs.
 */
export default function GettingStartedPage() {
    return (
        <HelpGuideLayout
            title="Getting Started with Flowdocs"
            description="Learn the basics of creating workspaces, inviting team members, and managing your documents."
            breadcrumbs={[{ label: "Getting Started", href: "/dashboard/help/getting-started" }]}
        >
            <h2>Creating Your First Workspace</h2>
            <p>
                Workspaces are the home for your team's content. To create a new workspace:
            </p>
            <ol>
                <li>Go to your Dashboard.</li>
                <li>Click the workspace switcher in the top left sidebar.</li>
                <li>Select "Create New Workspace".</li>
                <li>Give your workspace a name and icon.</li>
            </ol>

            <h2>Inviting Team Members</h2>
            <p>
                Collaboration is key in Flowdocs. Once you have a workspace, you can invite others:
            </p>
            <ul>
                <li>Navigate to <strong>Team</strong> in the sidebar.</li>
                <li>Click the <strong>Invite Member</strong> button.</li>
                <li>Enter their email address and select a role (Admin, Editor, or Viewer).</li>
                <li>Send the invitation.</li>
            </ul>

            <h2>Creating Documents</h2>
            <p>
                Start capturing your knowledge by creating wiki pages:
            </p>
            <ol>
                <li>Go to the <strong>Wiki</strong> section.</li>
                <li>Click the <strong>+ New Page</strong> button.</li>
                <li>Enter a title and start typing in the editor.</li>
                <li>Use slash commands (type <code>/</code>) to insert rich content like tables, images, and more.</li>
            </ol>
        </HelpGuideLayout>
    );
}
