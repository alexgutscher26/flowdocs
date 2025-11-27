import { ExtendedMessage, MessageGroup, GroupedMessage } from "@/types/chat";
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from "date-fns";

/**
 * Format a date for message grouping
 */
export function formatMessageDate(date: Date): string {
    if (isToday(date)) {
        return "Today";
    }
    if (isYesterday(date)) {
        return "Yesterday";
    }
    return format(date, "MMMM d, yyyy");
}

/**
 * Format a timestamp for display
 */
export function formatMessageTime(date: Date): string {
    return format(date, "h:mm a");
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: ExtendedMessage[]): MessageGroup[] {
    const groups: Map<string, ExtendedMessage[]> = new Map();

    messages.forEach((message) => {
        const date = formatMessageDate(new Date(message.createdAt));
        const existing = groups.get(date) || [];
        groups.set(date, [...existing, message]);
    });

    return Array.from(groups.entries()).map(([date, msgs]) => ({
        date,
        messages: groupConsecutiveMessages(msgs),
    }));
}

/**
 * Group consecutive messages from the same user
 */
export function groupConsecutiveMessages(messages: ExtendedMessage[]): GroupedMessage[] {
    const grouped: GroupedMessage[] = [];
    let currentGroup: ExtendedMessage[] = [];
    let currentUserId: string | null = null;

    messages.forEach((message, index) => {
        const isSameUser = message.userId === currentUserId;
        const prevMessage = messages[index - 1];
        const timeDiff = prevMessage
            ? new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
            : 0;
        const isWithinTimeWindow = timeDiff < 5 * 60 * 1000; // 5 minutes

        if (isSameUser && isWithinTimeWindow) {
            currentGroup.push(message);
        } else {
            if (currentGroup.length > 0) {
                grouped.push({
                    id: currentGroup[0].id,
                    messages: currentGroup,
                    user: currentGroup[0].user,
                    firstMessageTime: new Date(currentGroup[0].createdAt),
                });
            }
            currentGroup = [message];
            currentUserId = message.userId;
        }
    });

    // Add the last group
    if (currentGroup.length > 0) {
        grouped.push({
            id: currentGroup[0].id,
            messages: currentGroup,
            user: currentGroup[0].user,
            firstMessageTime: new Date(currentGroup[0].createdAt),
        });
    }

    return grouped;
}

/**
 * Parse mentions from message content
 */
export function parseMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]);
    }

    return mentions;
}

/**
 * Highlight mentions in message content
 */
export function highlightMentions(content: string, currentUserId: string): string {
    return content.replace(/@(\w+)/g, (match, username) => {
        // You can enhance this to check if the mention is the current user
        return `<span class="mention">@${username}</span>`;
    });
}

/**
 * Extract URLs from message content
 */
export function extractUrls(content: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.match(urlRegex) || [];
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file type icon based on MIME type
 */
export function getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📽️";
    if (mimeType.includes("zip") || mimeType.includes("archive")) return "🗜️";
    return "📎";
}

/**
 * Check if a file is an image
 */
export function isImageFile(mimeType: string): boolean {
    return mimeType.startsWith("image/");
}

/**
 * Check if a file is a video
 */
export function isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith("video/");
}
