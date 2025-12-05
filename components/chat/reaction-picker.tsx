"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import type { EmojiClickData, Theme } from "emoji-picker-react";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

/**
 * Renders a reaction picker component that allows users to select emojis.
 */
export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("auto");

  // Detect theme from system/user preference
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDark ? "dark" : "light");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    /**
     * Handles theme changes based on media query matches.
     */
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Add reaction">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={theme}
          searchPlaceHolder="Search emoji..."
          width={350}
          height={450}
          previewConfig={{
            showPreview: true,
          }}
          skinTonesDisabled={false}
          autoFocusSearch={true}
          lazyLoadEmojis={true}
        />
      </PopoverContent>
    </Popover>
  );
}
