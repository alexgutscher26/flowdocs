"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = [
    "👍", "❤️", "😂", "😮", "😢", "🙏",
    "🎉", "🔥", "👏", "✅", "❌", "👀",
    "💯", "🚀", "💡", "⭐", "✨", "💪",
];

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Add reaction"
                >
                    <Smile className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                <div className="grid grid-cols-6 gap-1">
                    {COMMON_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSelect(emoji)}
                            className="h-10 w-10 flex items-center justify-center text-2xl hover:bg-muted rounded transition-colors"
                            title={`React with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
