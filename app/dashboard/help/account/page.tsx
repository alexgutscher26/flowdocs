import { HelpGuideLayout } from "@/components/help/help-guide-layout";

/**
 * Renders the Account & Billing help page with instructions for managing profile, changing password, and subscription plans.
 */
export default function AccountPage() {
    return (
        <HelpGuideLayout
            title="Account & Billing"
            description="Manage your personal account settings, subscription plans, and billing information."
            breadcrumbs={[{ label: "Account & Billing", href: "/dashboard/help/account" }]}
        >
            <h2>Managing Your Profile</h2>
            <p>
                You can update your personal information at any time:
            </p>
            <ul>
                <li>Go to <strong>Settings</strong> {">"} <strong>Profile</strong>.</li>
                <li>Update your name, email, and profile picture.</li>
                <li>Click <strong>Save Changes</strong>.</li>
            </ul>

            <h2>Changing Your Password</h2>
            <p>
                To ensure your account is secure, you can change your password:
            </p>
            <ol>
                <li>Navigate to <strong>Settings</strong> {">"} <strong>Security</strong>.</li>
                <li>Enter your current password.</li>
                <li>Enter and confirm your new password.</li>
            </ol>

            <h2>Subscription Plans</h2>
            <p>
                Flowdocs offers flexible plans for teams of all sizes. You can view our current plans on the pricing page.
                To upgrade or downgrade your plan:
            </p>
            <ol>
                <li>Go to <strong>Settings</strong> {">"} <strong>Billing</strong>.</li>
                <li>Click on <strong>Change Plan</strong>.</li>
                <li>Select the plan that best fits your needs.</li>
            </ol>

            <h2>Invoices</h2>
            <p>
                You can access your billing history and download invoices from the <strong>Billing</strong> section in Settings.
            </p>
        </HelpGuideLayout>
    );
}
