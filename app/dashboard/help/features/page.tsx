import { HelpGuideLayout } from "@/components/help/help-guide-layout";

export default function FeaturesPage() {
    return (
        <HelpGuideLayout
            title="Features Guide"
            description="Explore the powerful features that make Flowdocs the best place for your team's knowledge."
            breadcrumbs={[{ label: "Features Guide", href: "/dashboard/help/features" }]}
        >
            <h2>Wiki & Documentation</h2>
            <p>
                Create beautiful, structured documentation with our block-based editor. Support for Markdown, code blocks, tables, and media embedding makes it easy to write technical docs or company policies.
            </p>

            <h2>Real-time Chat</h2>
            <p>
                Discuss your work right where it happens. Each workspace has dedicated channels for topic-based communication, and you can start threads on any document to keep context.
            </p>

            <h2>AI-Powered Search</h2>
            <p>
                Never lose track of information again. Our semantic search understands the meaning behind your query, not just keywords, helping you find exactly what you need across all your docs and chats.
            </p>

            <h2>AI Assistant</h2>
            <p>
                Use the built-in AI assistant to:
            </p>
            <ul>
                <li>Summarize long threads or documents.</li>
                <li>Draft new content based on your prompts.</li>
                <li>Answer questions about your workspace's knowledge base.</li>
            </ul>
        </HelpGuideLayout>
    );
}
