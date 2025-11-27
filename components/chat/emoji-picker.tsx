"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🙏",
  "🎉",
  "🔥",
  "👏",
  "✅",
  "❌",
  "👀",
  "💯",
  "🚀",
  "💡",
  "⭐",
  "✨",
  "💪",
  "👋",
  "🙌",
  "😎",
  "🤔",
  "😅",
  "🥰",
  "😊",
  "🤣",
  "💔",
  "💕",
  "💖",
  "💙",
];

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" title="Insert emoji">
          <Smile className="text-muted-foreground h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start" side="top">
        <div className="grid grid-cols-6 gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className="hover:bg-muted flex h-10 w-10 items-center justify-center rounded text-2xl transition-colors"
              title={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
