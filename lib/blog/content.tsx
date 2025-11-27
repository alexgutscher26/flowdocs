// import { Logo } from "#/ui/icons";
import {
  IconBook2,
  IconBuildingSkyscraper,
  IconChartBar,
  IconChartPie,
  IconFileAnalytics,
  IconScale,
} from "@tabler/icons-react";
import { allHelpPosts } from "content-collections";

export const BLOG_CATEGORIES = [
  {
    title: "Company",
    slug: "company",
    description:
      "Stay current on company updates, milestones, culture insights, and announcements about our journey and vision.",
  },
  {
    title: "Marketing",
    slug: "marketing",
    description:
      "Explore marketing strategies, growth tactics, and insights on building and scaling successful campaigns.",
  },
  {
    title: "Newsroom",
    slug: "newsroom",
    description:
      "Latest news, press releases, and important announcements from our team and industry.",
  },
  {
    title: "Partners",
    slug: "partners",
    description:
      "Discover partnership opportunities, collaborations, and success stories from our partner ecosystem.",
  },
  {
    title: "Engineering",
    slug: "engineering",
    description:
      "Deep dives into technical innovations, architecture decisions, and engineering best practices.",
  },
  {
    title: "Press",
    slug: "press",
    description:
      "Media coverage, press mentions, and official statements for journalists and media professionals.",
  },
];

export const POPULAR_ARTICLES = ["what-is-flowdocs", "organize-with-labels", "azure-saml-sso"];

export const HELP_CATEGORIES: {
  title: string;
  slug: "overview" | "getting-started" | "terms" | "for-investors" | "analysis" | "valuation";
  description: string;
  icon: React.ReactNode;
}[] = [
    {
      title: "FlowDocs Overview",
      slug: "overview",
      description:
        "Understand how FlowDocs transforms team conversations into searchable documentation automatically, eliminating lost context in endless chat threads.",
      icon: <IconBuildingSkyscraper className="h-6 w-6 text-gray-500" />,
    },
    {
      title: "Getting Started",
      slug: "getting-started",
      description:
        "Set up your workspace, create channels, and learn how to convert your first chat thread into a wiki page with our quick-start guide.",
      icon: <IconChartBar className="h-6 w-6 text-gray-500" />,
    },
    {
      title: "Key Concepts",
      slug: "terms",
      description:
        "Master FlowDocs terminology including workspaces, channels, threads, wiki pages, and version control to collaborate effectively with your team.",
      icon: <IconBook2 className="h-6 w-6 text-gray-500" />,
    },
    {
      title: "Team Collaboration",
      slug: "for-investors",
      description:
        "Best practices for organizing team knowledge, managing permissions, and creating a culture of documentation that scales with your organization.",
      icon: <IconFileAnalytics className="h-6 w-6 text-gray-500" />,
    },
    {
      title: "Wiki Features",
      slug: "analysis",
      description:
        "Explore wiki editing, markdown formatting, version history, tagging, and search capabilities to build a comprehensive knowledge base from your conversations.",
      icon: <IconChartPie className="h-6 w-6 text-gray-500" />,
    },
    {
      title: "Advanced Workflows",
      slug: "valuation",
      description:
        "Optimize your documentation workflow with nested pages, cross-references, automated tagging, and integration strategies for maximum team productivity.",
      icon: <IconScale className="h-6 w-6 text-gray-500" />,
    },
  ];

export const getPopularArticles = () => {
  const popularArticles = POPULAR_ARTICLES.map((slug) => {
    const post = allHelpPosts.find((post) => post.slug === slug);
    if (!post) {
      console.warn(`Popular article with slug "${slug}" not found`);
    }
    return post;
  }).filter((post) => post != null);

  return popularArticles;
};
