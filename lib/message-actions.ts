/**
 * Message Actions Utility Functions
 * Helper functions for message interaction features
 */

/**
 * Generate a permalink for a message
 */
export function generatePermalink(
    workspaceId: string,
    channelId: string,
    messageId: string,
    threadId?: string
): string {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    let url = `${baseUrl}/dashboard/chat/${workspaceId}?channel=${channelId}&message=${messageId}`;

    if (threadId) {
        url += `&thread=${threadId}`;
    }

    return url;
}

/**
 * Copy text to clipboard with user feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand("copy");
            textArea.remove();

            return successful;
        }
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        return false;
    }
}

/**
 * Check if user can forward a message
 */
export function canForwardMessage(
    message: { userId: string; type: string },
    currentUserId: string
): boolean {
    // Users can forward any message they have access to
    // System messages might be restricted
    if (message.type === "SYSTEM") {
        return false;
    }

    return true;
}

/**
 * Format message content for quote reply
 */
export function formatQuoteReply(
    content: string,
    userName: string,
    maxLength: number = 200
): string {
    // Truncate content if too long
    let quotedContent = content;
    if (content.length > maxLength) {
        quotedContent = content.substring(0, maxLength) + "...";
    }

    // Format as blockquote
    const lines = quotedContent.split("\n");
    const quotedLines = lines.map(line => `> ${line}`).join("\n");

    return `${quotedLines}\n> — ${userName}\n\n`;
}

/**
 * Build forwarded message content
 */
export function buildForwardedMessageContent(
    originalContent: string,
    originalUserName: string,
    channelName: string,
    comment?: string
): string {
    let content = `**Forwarded from #${channelName}**\n\n`;
    content += `> ${originalContent.replace(/\n/g, "\n> ")}\n`;
    content += `> — ${originalUserName}`;

    if (comment) {
        content += `\n\n${comment}`;
    }

    return content;
}

/**
 * Extract message preview text (first line or truncated)
 */
export function getMessagePreview(content: string, maxLength: number = 100): string {
    // Remove markdown formatting for preview
    const plainText = content
        .replace(/[*_~`#]/g, "")
        .replace(/\n/g, " ")
        .trim();

    if (plainText.length <= maxLength) {
        return plainText;
    }

    return plainText.substring(0, maxLength) + "...";
}
