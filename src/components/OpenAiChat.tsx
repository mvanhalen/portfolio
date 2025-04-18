"use client";

import { useState, useEffect } from "react";
import { Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function OpenAiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 rounded-full w-24 h-24 shadow-lg flex flex-col"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-12 h-12" />
        AI Chat
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <span className="hidden">Open Chat</span>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] p-4">
          <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4">Portfolio Chat</h2>
            <ScrollArea className="flex-grow mb-4">
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
                    {msg.content}
                  </span>
                </div>
              ))}
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about my portfolio, cv and me..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </div>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                setMessages([]);
                localStorage.removeItem("chatHistory");
              }}
            >
              Clear Chat
            </Button>
            <Button
              variant="outline"
              className="mt-2 flex items-center gap-2"
              onClick={() => window.location.href = "/admin"}
            >
              <Lock className="w-4 h-4" />
              Update Embeddings
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}