"use client";

import { MDXContent } from "@content-collections/mdx/react";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBulb,
  IconChartBar,
  IconChartLine,
  IconCircleCheck,
  IconInfoCircle,
  IconListCheck,
  IconScale,
} from "@tabler/icons-react";
import { allBlogPosts, allChangelogPosts, allHelpPosts } from "content-collections";
import Link from "next/link";

import BlurImage from "@/lib/blog/blur-image";
import { HELP_CATEGORIES, POPULAR_ARTICLES } from "@/lib/blog/content";
import { cn, formatDate } from "@/lib/utils";

const DcfChart = (props: Record<string, unknown>) => (
  <div className="text-warm-white/80">DCF Chart placeholder</div>
);
import CategoryCard from "./category-card";
import { CodeSandbox, StackBlitz } from "./codesandbox";
import CopyBox from "./copy-box";
import HelpArticleLink from "./help-article-link";
import ExpandingArrow from "./icons/expanding-arrow";
import { Mermaid } from "./mermaid";
import { Tabs, CodeTabs } from "./tabs";
import { Video } from "./video";
import ZoomImage from "./zoom-image";

const CustomLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const href = props.href;

  if (href.startsWith("/")) {
    return (
      <Link {...props} href={href}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

function AnimatedCTA(props: {
  badge?: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  size?: "default" | "large";
}) {
  return (
    <div
      className={cn(
        "bg-warm-grey-2/10 shadow-warm-grey-2/5 ring-warm-grey-2/20 hover:shadow-warm-grey-2/5 relative overflow-hidden rounded-xl p-8 shadow-lg ring-1 backdrop-blur-sm transition-shadow hover:shadow-lg",
        props.size === "large" && "min-h-[400px]"
      )}
    >
      <div className="relative flex h-full flex-col items-center justify-center gap-6 text-center">
        {props.badge && (
          <span className="border-warm-grey-2/20 bg-warm-grey-2/10 text-warm-white/80 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
            {props.badge}
          </span>
        )}
        <h3 className="text-warm-white text-2xl font-semibold tracking-tight">{props.title}</h3>
        <p className="text-warm-white/80">{props.description}</p>
        {(props.primaryAction || props.secondaryAction) && (
          <div className="flex gap-4">
            {props.primaryAction && (
              <Link
                href={props.primaryAction.href}
                className="bg-warm-grey-2/20 text-warm-white hover:bg-warm-grey-2/30 inline-flex items-center justify-center rounded-full px-6 py-2 font-medium transition-colors"
              >
                {props.primaryAction.label}
              </Link>
            )}
            {props.secondaryAction && (
              <Link
                href={props.secondaryAction.href}
                className="text-warm-white/80 ring-warm-grey-2/20 hover:bg-warm-grey-2/10 hover:text-warm-white inline-flex items-center justify-center gap-2 rounded-full px-6 py-2 font-medium ring-1 transition-colors"
              >
                {props.secondaryAction.label}
                <IconArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const components = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-warm-white mt-8 mb-4 text-2xl font-semibold underline-offset-4 hover:underline"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-warm-white mt-6 mb-3 text-xl font-medium underline-offset-4 hover:underline"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <CustomLink
      className="text-warm-white/80 hover:text-warm-white font-medium underline underline-offset-4"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="border-warm-grey-2/20 bg-warm-grey-2/10 text-warm-white rounded-md border px-2 py-1 font-medium before:hidden after:hidden"
      {...props}
    />
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="text-warm-white text-lg" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="text-warm-white p-4 text-left font-medium" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-warm-grey-2/20 text-warm-white/80 border-t p-4" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-warm-white/80 my-4 text-base leading-relaxed" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li
      className="text-warm-white/80 marker:text-warm-white/60 mb-2 text-base leading-relaxed"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-2 list-disc space-y-2 pl-6" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-2 list-decimal space-y-2 pl-6" {...props} />
  ),
  Note: (props: { variant?: "info" | "warning" | "success"; children: React.ReactNode }) => {
    const icons = {
      info: IconInfoCircle,
      warning: IconAlertTriangle,
      success: IconCircleCheck,
    };
    const Icon = icons[props.variant || "info"];

    return (
      <div
        className={cn(
          "mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-600 shadow-sm",
          {
            "border-blue-200 bg-blue-50": props.variant === "info",
            "border-yellow-200 bg-yellow-50": props.variant === "warning",
            "border-green-200 bg-green-50": props.variant === "success",
          }
        )}
      >
        <div className="flex items-start gap-3">
          <Icon
            className={cn("mt-0.5 h-5 w-5", {
              "text-blue-500": props.variant === "info",
              "text-yellow-500": props.variant === "warning",
              "text-green-500": props.variant === "success",
            })}
          />
          <div className="flex-1 text-gray-600">{props.children}</div>
        </div>
      </div>
    );
  },
  Quote: (props: {
    author: string;
    authorSrc: string;
    title: string;
    company: string;
    companySrc: string;
    text: string;
  }) => (
    <div className="border-warm-grey-2/20 bg-warm-grey-2/10 my-10 flex flex-col items-center justify-center space-y-6 rounded-md border p-10">
      <div className="from-warm-grey-2/20 to-warm-grey-1/20 w-fit rounded-full bg-gradient-to-r p-1.5">
        <BlurImage
          className="border-warm-grey-2/20 h-20 w-20 rounded-full border-2"
          src={props.authorSrc}
          alt={props.author}
          width={80}
          height={80}
        />
      </div>
      <p className="text-warm-white/80 text-center text-lg leading-relaxed [text-wrap:balance]">
        &ldquo;{props.text}&rdquo;
      </p>
      <div className="flex items-center justify-center space-x-4">
        <BlurImage
          className="border-warm-grey-2/20 h-12 w-12 rounded-md border-2"
          src={props.companySrc}
          alt={props.company}
          width={48}
          height={48}
        />
        <div className="flex flex-col">
          <p className="text-warm-white font-semibold">{props.author}</p>
          <p className="text-warm-white/80 text-sm">{props.title}</p>
        </div>
      </div>
    </div>
  ),
  Prerequisites: (props: { children: React.ReactNode }) => (
    <div className="border-warm-grey-2/20 bg-warm-grey-2/10 my-8 rounded-xl border p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <IconListCheck className="text-warm-white/60 h-5 w-5" />
        <h4 className="font-display text-warm-white text-lg font-semibold">Forutsetninger</h4>
      </div>
      <div className="prose prose-invert max-w-none">{props.children}</div>
    </div>
  ),
  CopyBox,
  GithubRepo: (props: { url: string }) => (
    <div className="not-prose border-warm-grey-2/20 bg-warm-grey-2/10 my-6 rounded-xl border p-4">
      <p className="text-warm-white/70 text-sm">Explore the project on GitHub</p>
      <Link
        href={props.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-warm-white mt-2 inline-flex items-center text-sm font-semibold underline-offset-4 hover:underline"
      >
        {props.url}
      </Link>
    </div>
  ),
  HelpArticles: (props: { articles: string[] }) => (
    <div className="border-warm-grey-2/20 bg-warm-grey-2/10 grid gap-2 rounded-xl border p-4">
      {(props.articles || POPULAR_ARTICLES).map((slug) => (
        <HelpArticleLink key={slug} article={allHelpPosts.find((post) => post.slug === slug)!} />
      ))}
    </div>
  ),
  Tweet: (props: { id: string }) => (
    <div className="not-prose border-warm-grey-2/20 bg-warm-grey-2/10 my-6 rounded-xl border p-4">
      <p className="text-warm-white/70 text-sm">Embedded tweets are currently unavailable.</p>
      <Link
        href={`https://twitter.com/i/web/status/${props.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-warm-white mt-2 inline-flex items-center text-sm font-semibold underline-offset-4 hover:underline"
      >
        View on X ↗
      </Link>
    </div>
  ),
  HelpCategories: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {HELP_CATEGORIES.map((category) => (
        <CategoryCard
          key={category.slug}
          href={`/help/category/${category.slug}`}
          name={category.title}
          description={category.description}
          icon={category.icon}
          pattern={{
            y: 16,
            squares: [
              [0, 1],
              [1, 3],
            ],
          }}
        />
      ))}
    </div>
  ),
  Changelog: (props: { before: string; count: number }) => (
    <ul className="border-warm-grey-2/20 bg-warm-grey-2/10 grid list-none rounded-xl border p-4">
      {[...allBlogPosts, ...allChangelogPosts]
        .filter((post) => post.publishedAt <= props.before)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, props.count)
        .map((post: Record<string, unknown>) => (
          <li key={post.slug}>
            <Link
              href={`/${post.type === "BlogPost" ? "blog" : "changelog"}/${post.slug}`}
              className="group hover:bg-warm-grey-2/20 active:bg-warm-grey-2/30 flex items-center justify-between rounded-lg px-2 py-3 transition-colors sm:px-4"
            >
              <div>
                <p className="text-warm-white/60 group-hover:text-warm-white/80 text-xs font-medium">
                  {formatDate(post.publishedAt)}
                </p>
                <h3 className="text-warm-white my-px text-base font-medium">{post.title}</h3>
                <p className="text-warm-white/80 group-hover:text-warm-white line-clamp-1 text-sm">
                  {post.summary}
                </p>
              </div>
              <ExpandingArrow className="text-warm-white/60 group-hover:text-warm-white/80 -ml-4 h-4 w-4" />
            </Link>
          </li>
        ))}
    </ul>
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-warm-white font-semibold" {...props} />
  ),
  Info: (props: { children: React.ReactNode }) => (
    <div className="border-warm-grey-2/20 bg-warm-grey-2/10 my-6 flex items-start gap-4 rounded-lg border p-6 backdrop-blur-sm">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        <IconInfoCircle className="text-warm-white/60 h-6 w-6" />
      </div>
      <div className="flex-1 text-[0.95rem] leading-relaxed">
        <div className="text-warm-white font-medium">Fun fact:</div>
        <div className="text-warm-white/80 mt-1">{props.children}</div>
      </div>
    </div>
  ),
  Stepper: (props: {
    items: {
      title: string;
      content: React.ReactNode;
      image?: {
        src: string;
        alt: string;
        width?: number;
        height?: number;
      };
    }[];
  }) => {
    const MDXImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
      return <ZoomImage {...props} />;
    };

    return (
      <div className="my-8 flex flex-col space-y-12">
        {props.items.map((item, idx) => (
          <div key={idx} className="flex gap-6">
            <div className="flex-none">
              <div className="border-warm-grey-2/20 bg-warm-grey-2/10 text-warm-white flex h-8 w-8 items-center justify-center rounded-full border text-lg font-semibold">
                {idx + 1}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-warm-white text-xl font-semibold">{item.title}</h3>
              <div className="text-warm-white/80 text-base">{item.content}</div>
              {item.image && (
                <div className="mt-4 overflow-hidden rounded-lg">
                  <MDXImage
                    src={item.image.src}
                    alt={item.image.alt}
                    width={item.image.width || 800}
                    height={item.image.height || 400}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  },
  Example: (props: {
    title?: string;
    steps: {
      label: string;
      value: string | number;
      calculation?: string;
      isResult?: boolean;
    }[];
  }) => (
    <div className="border-warm-grey-2/20 bg-warm-grey-2/10 my-8 rounded-xl border p-6 backdrop-blur-sm">
      {props.title && (
        <h4 className="font-display text-warm-white mb-4 text-lg font-semibold">{props.title}</h4>
      )}
      <div className="flex flex-col space-y-3">
        {props.steps.map((step, idx) => (
          <div
            key={idx}
            className={cn("flex flex-col space-y-1", {
              "border-warm-grey-2/20 mt-4 border-t pt-4": step.isResult,
            })}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-warm-white/80">{step.label}</span>
              <span
                className={cn(
                  "font-mono text-lg",
                  step.isResult ? "text-warm-white font-semibold" : "text-warm-white/80"
                )}
              >
                {typeof step.value === "number"
                  ? new Intl.NumberFormat("nb-NO").format(step.value)
                  : step.value}
              </span>
            </div>
            {step.calculation && (
              <div className="text-warm-white/60 text-sm">{step.calculation}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  ),
  Summary: (props: {
    title?: string;
    points: {
      title: string;
      description?: string;
      iconName?: string;
    }[];
  }) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      barChart: <IconChartBar className="text-warm-white/60 h-5 w-5" />,
      scales: <IconScale className="text-warm-white/60 h-5 w-5" />,
      lineChart: <IconChartLine className="text-warm-white/60 h-5 w-5" />,
      lightbulb: <IconBulb className="text-warm-white/60 h-5 w-5" />,
    };

    return (
      <div className="border-warm-grey-2/20 bg-warm-grey-2/10 my-8 rounded-xl border p-6 backdrop-blur-sm">
        {props.title && (
          <h4 className="font-display text-warm-white mb-6 text-xl font-semibold">{props.title}</h4>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          {props.points.map((point, idx) => (
            <div
              key={idx}
              className="border-warm-grey-2/20 bg-warm-grey-2/5 flex flex-col space-y-2 rounded-lg border p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                {point.iconName && iconMap[point.iconName]}
                <h5 className="text-warm-white font-medium">{point.title}</h5>
              </div>
              {point.description && (
                <p className="text-warm-white/70 text-sm leading-relaxed">{point.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },
  CTA: (props: {
    badge?: string;
    title: string;
    description: string;
    primaryAction?: {
      label: string;
      href: string;
    };
    secondaryAction?: {
      label: string;
      href: string;
    };
    size?: "default" | "large";
  }) => <AnimatedCTA {...props} />,
  DcfChart: (props: Record<string, unknown>) => (
    <div className="">
      <DcfChart {...props} />
    </div>
  ),
  Video,
  Mermaid,
  CodeSandbox,
  StackBlitz,
  Tabs,
  CodeTabs,
};

interface MDXProps {
  code: string;
  images?: { alt: string; src: string; blurDataURL: string }[];
  className?: string;
}

export function MDX({ code, images, className }: MDXProps) {
  const MDXImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    if (!images) return null;
    const blurDataURL = images.find((image) => image.src === props.src)?.blurDataURL;

    return <ZoomImage {...props} blurDataURL={blurDataURL} />;
  };

  return (
    <article
      data-mdx-container
      className={cn(
        "prose max-w-none transition-all",
        "prose-headings:relative prose-headings:scroll-mt-20 prose-headings:font-display prose-headings:font-bold prose-headings:text-warm-white",
        "prose-p:text-warm-white/80 prose-p:leading-relaxed prose-p:my-4",
        "prose-a:text-warm-white/80 prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-warm-white",
        "prose-code:text-warm-white prose-code:bg-warm-grey-2/10 prose-code:px-2 prose-code:py-1",
        "prose-li:text-warm-white/80 prose-li:leading-relaxed prose-li:mb-2",
        "prose-ul:my-8 prose-ul:space-y-6",
        "prose-ol:my-4 prose-ol:space-y-2",
        className
      )}
    >
      <MDXContent
        code={code}
        components={{
          ...components,
          Image: MDXImage,
        }}
      />
    </article>
  );
}
