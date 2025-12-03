"use client";

import { useEffect } from "react";

/**
 * UserJot feedback widget component
 * Loads the UserJot SDK and initializes the widget with the project ID
 */
export function UserJotWidget() {
    const projectId = process.env.NEXT_PUBLIC_USERJOT_PROJECT_ID;

    useEffect(() => {
        // Only load if project ID is configured
        if (!projectId) {
            console.warn("UserJot project ID not configured");
            return;
        }

        // Initialize UserJot queue and proxy
        if (typeof window !== "undefined") {
            window.$ujq = window.$ujq || [];
            window.uj =
                window.uj ||
                new Proxy(
                    {},
                    {
                        get: (_, p) =>
                            (...a: any[]) =>
                                window.$ujq.push([p as string, ...a]),
                    }
                ) as any;

            // Load UserJot SDK script
            const script = document.createElement("script");
            script.src = "https://cdn.userjot.com/sdk/v2/uj.js";
            script.type = "module";
            script.async = true;
            script.onload = () => {
                // Initialize UserJot with project ID and enable widget
                window.uj.init(projectId, { widget: true });
            };
            document.head.appendChild(script);

            // Cleanup function
            return () => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            };
        }
    }, [projectId]);

    return null;
}
