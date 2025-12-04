import { MentionSuggestion } from "@/lib/mentions";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Hash, Users, FileText, AtSign } from "lucide-react";

interface MentionListProps {
    suggestions: MentionSuggestion[];
    onSelect: (suggestion: MentionSuggestion) => void;
    activeIndex?: number;
}

export function MentionList({ suggestions, onSelect, activeIndex = 0 }: MentionListProps) {
    if (suggestions.length === 0) return null;

    return (
        <div className="bg-popover absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-md border p-1 shadow-md animate-in fade-in zoom-in-95 duration-100">
            <Command>
                <CommandList>
                    <CommandGroup heading="Suggestions">
                        {suggestions.map((suggestion, index) => (
                            <CommandItem
                                key={`${suggestion.type}-${suggestion.id}`}
                                onSelect={() => onSelect(suggestion)}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2",
                                    activeIndex === index && "bg-accent text-accent-foreground"
                                )}
                            >
                                <div className="bg-muted flex h-6 w-6 items-center justify-center overflow-hidden rounded-full shrink-0">
                                    {suggestion.type === "user" ? (
                                        suggestion.image ? (
                                            <img
                                                src={suggestion.image}
                                                alt={suggestion.display}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs">{suggestion.display[0]}</span>
                                        )
                                    ) : suggestion.type === "special" ? (
                                        <Users className="h-3 w-3" />
                                    ) : suggestion.type === "channel" ? (
                                        <Hash className="h-3 w-3" />
                                    ) : suggestion.type === "wiki" ? (
                                        <FileText className="h-3 w-3" />
                                    ) : (
                                        <AtSign className="h-3 w-3" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate font-medium">{suggestion.display}</span>
                                    {suggestion.metadata?.description && (
                                        <span className="text-muted-foreground truncate text-xs">
                                            {suggestion.metadata.description}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    );
}
