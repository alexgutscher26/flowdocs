export const siteConfig = {
  name: "FlowDocs",
  title: "FlowDocs – Team Chat & Wiki",
  description:
    "FlowDocs combines real-time team communication with intelligent knowledge management. Chat naturally becomes searchable documentation—no more lost context in endless threads. Built for modern teams who value both speed and organization.",
  url: "https://www.flowdocs.com",
  ogImage: "/og.png",

  // Social and external links
  links: {
    twitter: "https://x.com/snackforcode",
    github: "https://github.com/alexgutscher26/flowdocs",
    discord: "https://discord.gg/flowdocs",
    linkedin: "https://linkedin.com/company/flowdocs",
  },

  // SEO keywords
  keywords: [
    "FlowDocs",
    "team communication",
    "knowledge base",
    "documentation automation",
    "chat to wiki",
    "team collaboration",
    "knowledge management",
    "Slack alternative",
    "Notion alternative",
    "real-time collaboration",
    "searchable chat",
    "team workspace",
    "project documentation",
    "async communication",
    "team productivity",
    "wiki software",
    "collaborative workspace",
  ],

  // Author and creator information
  authors: [
    {
      name: "snackforcode",
      url: "https://www.flowdocs.com",
    },
  ],
  creator: "snackforcode",
  publisher: "FlowDocs",
  twitterHandle: "@codehagen",

  // Localization
  locale: "en_US",
  category: "Productivity Software",

  // Email branding configuration
  email: {
    brandName: "FlowDocs",
    tagline:
      "Chat that becomes documentation automatically—no more lost context in endless Slack threads.",
    supportEmail: "support@flowdocs.com",
    fromEmail: "noreply@flowdocs.com",
    fromName: "FlowDocs",
  },

  // Feature highlights for marketing
  features: {
    chat: "Real-time messaging with threads and reactions",
    wiki: "Automatic conversion of conversations to documentation",
    search: "Powerful full-text search across all content",
    integrations: "Connect with Google Drive, GitHub, and more",
    ai: "AI-powered chat assistance and content generation",
    collaboration: "Role-based permissions and team workspaces",
  },

  // Platform metadata
  platform: {
    version: "1.0.0",
    status: "production",
    lastUpdated: "2025-12-02",
  },
};

export type SiteConfig = typeof siteConfig;
