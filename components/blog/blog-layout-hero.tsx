"use client";

import { IconCheck, IconList } from "@tabler/icons-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { BLOG_CATEGORIES } from "@/lib/blog/content";
import { cn } from "@/lib/utils";

import MaxWidthWrapper from "./max-width-wrapper";
import Popover from "./popover";

export default function BlogLayoutHero() {
  const { slug } = useParams() as { slug?: string };

  const data = BLOG_CATEGORIES.find((category) => category.slug === slug);

  const [openPopover, setOpenPopover] = useState(false);

  return (
    <>
      <MaxWidthWrapper>
        <div className="max-w-screen-sm pt-32 pb-16 md:pt-40 md:pb-15">
          <h1 className="font-display text-warm-white text-3xl font-extrabold sm:text-4xl">
            {data?.title || "HagenKit Blog"}
          </h1>
          <p className="text-warm-white/80 mt-4 text-xl">
            {data?.description ||
              "Insights, product updates, and playbooks from the HagenKit team."}
          </p>
          <nav className="border-warm-grey/20 bg-warm-white/5 mt-6 hidden w-fit items-center space-x-2 rounded-full border p-2 backdrop-blur-sm md:flex">
            <CategoryLink title="Overview" href="/blog" active={!slug} />
            {BLOG_CATEGORIES.map((category) => (
              <CategoryLink
                key={category.slug}
                title={category.title}
                href={`/blog/category/${category.slug}`}
                active={category.slug === slug}
              />
            ))}
            <CategoryLink title="Customers" href="/customers" />
          </nav>
        </div>
      </MaxWidthWrapper>
      <div className="border-warm-grey/20 border-t shadow-[inset_10px_-50px_94px_0_rgb(199,199,199,0.2)] backdrop-blur-lg">
        <Popover
          content={
            <div className="w-full p-4">
              <CategoryLink
                title="Overview"
                href="/blog"
                active={!slug}
                mobile
                setOpenPopover={setOpenPopover}
              />
              {BLOG_CATEGORIES.map((category) => (
                <CategoryLink
                  key={category.slug}
                  title={category.title}
                  href={`/blog/category/${category.slug}`}
                  active={category.slug === slug}
                  mobile
                  setOpenPopover={setOpenPopover}
                />
              ))}
              <CategoryLink
                title="Customer Stories"
                href="#"
                mobile
                setOpenPopover={setOpenPopover}
              />
              <CategoryLink
                title="Product Updates"
                href="#"
                mobile
                setOpenPopover={setOpenPopover}
              />
            </div>
          }
          openPopover={openPopover}
          setOpenPopover={setOpenPopover}
          mobileOnly
        >
          <button
            onClick={() => {
              setOpenPopover(!openPopover);
            }}
            className="border-warm-grey/20 text-warm-white/80 flex w-full items-center space-x-2 border-t px-2.5 py-4 text-sm"
          >
            <IconList size={16} className="text-warm-white/60" />
            <p>Categories</p>
          </button>
        </Popover>
      </div>
    </>
  );
}

const CategoryLink = ({
  title,
  href,
  active,
  mobile,
  setOpenPopover,
}: {
  title: string;
  href: string;
  active?: boolean;
  mobile?: boolean;
  setOpenPopover?: (open: boolean) => void;
}) => {
  if (mobile) {
    return (
      <Link
        href={href}
        {...(setOpenPopover && {
          onClick: () => setOpenPopover(false),
        })}
        className="text-warm-white/80 hover:bg-warm-white/5 active:bg-warm-white/10 flex w-full items-center justify-between rounded-md p-2 transition-colors"
      >
        <p className="text-sm">{title}</p>
        {active && <IconCheck size={16} className="text-warm-white/60" />}
      </Link>
    );
  }
  return (
    <Link href={href} className="relative z-10">
      <div
        className={cn(
          "rounded-full px-4 py-2 text-sm transition-all",
          active
            ? "bg-warm-white/10 text-warm-white"
            : "text-warm-white/80 hover:bg-warm-white/5 active:bg-warm-white/10"
        )}
      >
        {title}
      </div>
      {active && (
        <motion.div
          layoutId="indicator"
          className="from-warm-grey/20 via-warm-grey/10 to-warm-grey/20 absolute top-0 left-0 h-full w-full rounded-full bg-gradient-to-tr"
          style={{ zIndex: -1 }}
        />
      )}
    </Link>
  );
};
