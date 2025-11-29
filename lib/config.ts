export const siteConfig = {
  name: "FlowDocs",
  title: "FlowDocs – Team Communication & Knowledge Base Hybrid",
  description:
    "FlowDocs by snackforcode is a production-ready boilerplate for SaaS apps, combining design, auth, and billing into a unified starter kit.",
  ogImage: "/og.png",
  links: {
    twitter: "https://x.com/snackforcode",
  },
  keywords: [
    "snackforcode",
    "FlowDocs",
    "Chat that becomes documentation automatically",
    "no more lost context in endless Slack threads",
    "team communication & knowledge base hybrid",
    "communication",
    "knowledge",
    "knowledge base",
    "slack",
    "notion",
  ],
  authors: [
    {
      name: "snackforcode",
      url: "https://www.flowdocs.com",
    },
  ],
  creator: "snackforcode",
  publisher: "snackforcode",
  twitterHandle: "@codehagen",
  locale: "en_US",
  category: "Software",
  // Email branding configuration
  email: {
    brandName: "FlowDocs",
    tagline:
      "Chat that becomes documentation automatically—no more lost context in endless Slack threads.",
    supportEmail: "support@flowdocs.com",
    fromEmail: "noreply@flowdocs.com",
    fromName: "FlowDocs",
  },
};

export type SiteConfig = typeof siteConfig;
