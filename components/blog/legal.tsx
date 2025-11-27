import { allLegalPosts } from "content-collections";

import { formatDate } from "@/lib/utils";

import MaxWidthWrapper from "./max-width-wrapper";
import { MDX } from "./mdx";

export default function LegalPage({ post }: { post: Record<string, unknown> }) {
  if (!post) {
    return <div className="text-muted-foreground">Juridisk innlegg ikke funnet</div>;
  }

  return (
    <div className="bg-background">
      <div className="bg-card py-20 sm:py-40">
        <h1 className="font-display text-foreground mt-5 text-center text-4xl leading-[1.15] font-extrabold sm:text-6xl sm:leading-[1.15]">
          {post.title}
        </h1>
      </div>
      <MaxWidthWrapper className="flex max-w-screen-md flex-col items-center p-10 sm:pt-20">
        <MDX code={post.mdx} />
        <div className="border-border mt-10 w-full border-t pt-10 text-center">
          <p className="text-muted-foreground">Sist oppdatert: {formatDate(post.updatedAt)}</p>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
