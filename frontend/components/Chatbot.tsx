"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { sendChatbotMessage, ChatMessage } from "@/lib/chatbot-api";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, X, Send, Loader2, Sparkles, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          user: "",
          assistant:
            "Hello! 👋 I'm **IEM Assist**, your AI helper for IEM Connect. How can I help you today?",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !token) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Add user message to conversation
    const newUserMessage: ChatMessage = {
      user: userMessage,
      assistant: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Send to backend
      const response = await sendChatbotMessage(userMessage, messages);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        user: userMessage,
        assistant: response.message,
        timestamp: response.timestamp,
      };

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = assistantMessage;
        return updated;
      });

      // Increment unread if minimized
      if (isMinimized) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error("Chatbot error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to get response. Please try again.",
        variant: "destructive",
      });

      // Remove failed message
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!token) return null; // Don't show chatbot if not logged in

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open chat"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
            
            {/* Button */}
            <div className="relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110">
              <MessageCircle className="h-6 w-6 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
            </div>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
            isMinimized ? "w-80 h-16" : "w-[400px] h-[600px]"
          }`}
          style={{
            animation: "slideUp 0.4s ease-out",
          }}
        >
          {/* Glassmorphism Container */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            {/* Background blur layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-pink-600/10" />
            
            {/* Border glow */}
            <div className="absolute inset-0 rounded-2xl border border-white/10" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      IEM Assist
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                    </h3>
                    <p className="text-xs text-slate-400">Powered by AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMinimize}
                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              {!isMinimized && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.map((msg, index) => (
                      <div key={index} className="space-y-3">
                        {/* User Message */}
                        {msg.user && (
                          <div className="flex justify-end">
                            <div className="max-w-[85%] bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
                              <p className="text-sm leading-relaxed">{msg.user}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Assistant Message */}
                        {msg.assistant && (
                          <div className="flex justify-start">
                            <div className="max-w-[85%] bg-white/10 backdrop-blur-sm text-slate-100 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                              <div className="prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => (
                                      <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="text-blue-300 font-semibold">{children}</strong>
                                    ),
                                    code: ({ children }) => (
                                      <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-xs text-blue-300">{children}</code>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc list-inside space-y-1 text-sm">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal list-inside space-y-1 text-sm">{children}</ol>
                                    ),
                                    li: ({ children }) => (
                                      <li className="text-slate-200">{children}</li>
                                    ),
                                  }}
                                >
                                  {msg.assistant}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            adjustTextareaHeight();
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask me anything about IEM Connect..."
                          disabled={loading}
                          rows={1}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none transition-all"
                          style={{ maxHeight: "120px" }}
                        />
                      </div>
                      <Button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        size="icon"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Press Enter to send • Shift+Enter for new line
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
