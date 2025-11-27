"use client";

import BlurImage from "@/lib/blog/blur-image";
import Link from "next/link";
import ExpandingArrow from "./icons/expanding-arrow";

export const Integration = ({
  slug,
  site,
  description,
}: {
  slug: string;
  site?: string;
  description?: string;
}) => {
  return (
    <Link
      href={site || `/integrations/${slug}`}
      {...(site ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className="group border-warm-grey/10 bg-warm-white/5 hover:border-warm-grey/20 hover:bg-warm-white/10 dark:border-warm-white/10 dark:bg-warm-grey-3/5 dark:hover:border-warm-white/20 dark:hover:bg-warm-grey-3/10 flex h-full flex-col items-center justify-between space-y-4 rounded-xl border p-8 backdrop-blur-sm transition-all sm:p-10"
    >
      <div className="flex flex-col items-center space-y-4">
        <BlurImage
          src={`/_static/integrations/${slug}.svg`}
          alt={slug.toUpperCase()}
          width={520}
          height={182}
          className="max-h-16 grayscale transition-all group-hover:grayscale-0"
        />
        {description && (
          <>
            <div className="bg-warm-grey/10 dark:bg-warm-white/10 h-px w-full" />
            <p className="text-warm-grey-2 dark:text-warm-grey-1 text-center text-sm">
              {description}
            </p>
          </>
        )}
      </div>
      <div className="flex space-x-1">
        <p className="text-warm-grey-2 group-hover:text-warm-grey dark:text-warm-grey-1 dark:group-hover:text-warm-white text-sm font-medium transition-colors">
          {site ? "Visit site" : "Learn more"}
        </p>
        <ExpandingArrow className="text-warm-grey-2 group-hover:text-warm-grey dark:text-warm-grey-1 dark:group-hover:text-warm-white transition-colors" />
      </div>
    </Link>
  );
};
