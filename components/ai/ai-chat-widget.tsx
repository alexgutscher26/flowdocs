"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ThumbsUp, ThumbsDown, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
  feedback?: "helpful" | "not-helpful";
}

interface AIChatWidgetProps {
  workspaceId: string;
  className?: string;
}

/**
 * AIChatWidget component for interactive AI chat functionality.
 *
 * This component manages the state of the chat interface, including message history, user input, and loading status. It utilizes localStorage to persist messages across sessions and handles sending user queries to an AI service, processing responses, and displaying them. Feedback on assistant messages can also be submitted for analytics. The component features auto-scrolling and a toggle button for visibility.
 *
 * @param {Object} props - The properties for the AIChatWidget.
 * @param {string} props.workspaceId - The unique identifier for the workspace.
 * @param {string} props.className - Additional class names for styling the component.
 */
export function AIChatWidget({ workspaceId, className }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`ai-chat-${workspaceId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, [workspaceId]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai-chat-${workspaceId}`, JSON.stringify(messages));
    }
  }, [messages, workspaceId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Handles sending a user message and receiving a response from the AI.
   *
   * The function checks if the input is valid and not currently loading. It constructs a user message and updates the message state.
   * It then makes a POST request to the AI chat API with the user's input and workspace ID. If the response is successful, it constructs
   * an assistant message and updates the message state. In case of an error, it logs the error and sends an error message to the user.
   *
   * @param input - The user's input message to be sent to the AI.
   * @param isLoading - A boolean indicating whether a request is currently in progress.
   * @param setMessages - A function to update the messages state.
   * @param setInput - A function to reset the input state.
   * @param setIsLoading - A function to update the loading state.
   * @param workspaceId - The ID of the workspace associated with the user's request.
   * @throws Error If the response from the AI chat API is not ok.
   */
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          workspaceId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user feedback for a specific message.
   *
   * This function updates the local state of messages by setting the feedback for the message identified by messageId.
   * It then attempts to send the feedback to the backend for analytics via a POST request.
   * If the request fails, it logs an error to the console.
   *
   * @param messageId - The ID of the message for which feedback is being provided.
   * @param feedback - The feedback type, which can be either "helpful" or "not-helpful".
   */
  const handleFeedback = async (messageId: string, feedback: "helpful" | "not-helpful") => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback } : m)));

    // TODO: Send feedback to backend for analytics
    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, feedback }),
      });
    } catch (error) {
      console.error("Failed to send feedback", error);
    }
  };

  return (
    <div className={cn("fixed right-4 bottom-4 z-50", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-background mb-4 flex h-[600px] w-[400px] flex-col rounded-lg border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary size-5" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="size-8"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center text-sm">
                  <Sparkles className="size-8 opacity-50" />
                  <p>Ask me anything about your workspace!</p>
                  <p className="text-xs">
                    I can help you find information, summarize threads, and more.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col gap-2",
                        message.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-4 py-2",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="text-muted-foreground max-w-[85%] text-xs">
                          <p className="mb-1 font-medium">Sources:</p>
                          <ul className="list-inside list-disc space-y-0.5">
                            {message.sources.map((source, idx) => (
                              <li key={idx}>{source}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Feedback */}
                      {message.role === "assistant" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "size-6",
                              message.feedback === "helpful" && "text-green-600"
                            )}
                            onClick={() => handleFeedback(message.id, "helpful")}
                          >
                            <ThumbsUp className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "size-6",
                              message.feedback === "not-helpful" && "text-red-600"
                            )}
                            onClick={() => handleFeedback(message.id, "not-helpful")}
                          >
                            <ThumbsDown className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-start gap-2">
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <div className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                          <div className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                          <div className="size-2 animate-bounce rounded-full bg-current" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="size-14 rounded-full shadow-lg"
        >
          {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        </Button>
      </motion.div>
    </div>
  );
}
