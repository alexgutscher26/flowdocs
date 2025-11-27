import { HelpPost } from "content-collections";
import Link from "next/link";

import ExpandingArrow from "./icons/expanding-arrow";

interface HelpArticleLinkProps {
  article: HelpPost;
}

export default function HelpArticleLink({ article }: HelpArticleLinkProps) {
  if (!article || !article.slug) {
    return null; // Or return a fallback UI
  }

  return (
    <Link
      href={`/help/article/${article.slug}`}
      className="group hover:bg-warm-grey-2/20 active:bg-warm-grey-2/30 flex items-center justify-between rounded-lg px-2 py-3 transition-colors sm:px-4"
    >
      <h3 className="text-warm-white/80 group-hover:text-warm-white text-sm font-medium sm:text-base">
        {article.title || "Untitled Article"}
      </h3>
      <ExpandingArrow className="text-warm-white/60 group-hover:text-warm-white/80 -ml-4 h-4 w-4" />
    </Link>
  );
}
