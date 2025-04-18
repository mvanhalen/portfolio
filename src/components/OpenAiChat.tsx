"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, MessageSquare, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@radix-ui/react-dialog";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function OpenAiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomSectionRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const storedMessages = localStorage.getItem("chatHistory");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to latest message and handle sheet open
  useEffect(() => {
    const scrollToBottom = (attempt = 0) => {
      console.log(`Scroll attempt ${attempt}:`, {
        messagesContainerRef: messagesContainerRef.current,
        scrollAreaRef: scrollAreaRef.current,
      });
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      } else if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        } else {
          console.warn("Scroll container not found");
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      } else if (attempt < 3) {
        // Retry up to 3 times
        console.warn(`Refs not available, retrying attempt ${attempt + 1}`);
        setTimeout(() => scrollToBottom(attempt + 1), 100);
      } else {
        console.warn("No refs available for scrolling after retries");
      }
    };

    // Delay to ensure DOM updates
    const timer = setTimeout(() => scrollToBottom(), 300);
    return () => clearTimeout(timer);
  }, [messages, open]);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial call
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat API error");

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "**Error:** Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed-button"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-12 h-12" />
        AI Chat
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <span className="hidden">Open Chat</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col h-full">
          <VisuallyHidden asChild>
            <DialogTitle>Martijn&apos;s Portfolio Chat</DialogTitle>
          </VisuallyHidden>
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-20 flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">Martijn&apos;s Portfolio Chat</h2>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close chat">
                <X className="w-6 h-6" />
              </Button>
            </SheetClose>
          </div>
          <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto">
            <div className="px-4 pt-14 pb-20 min-h-[calc(100vh-200px)]">
              <div ref={messagesContainerRef}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${
                      msg.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-block p-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <div className="prose dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          <div ref={bottomSectionRef} className="sticky bottom-0 flex flex-col gap-2 px-4 py-4 bg-white dark:bg-gray-800 z-10">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about my portfolio, cv and me..."
                rows={2}
                className="resize-none"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={() => {
                  setTimeout(() => {
                    bottomSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                  }, 300);
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="h-[72px] flex items-center justify-center"
              >
                {isLoading ? (
                  "Sending..."
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 flex items-center gap-2"
                onClick={() => {
                  setMessages([]);
                  localStorage.removeItem("chatHistory");
                }}
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex items-center gap-2"
                onClick={() => (window.location.href = "/admin")}
              >
                <Lock className="w-4 h-4" />
                Update Embeddings
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}