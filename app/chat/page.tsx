"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Bot, Upload, Trash2, FileText, X, MessageSquare, Sparkles, Download, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TopNav } from "@/components/common/TopNav";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UploadedDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  chunkCount: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userHasScrolledRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
      try {
        const decoded = atob(storedKey);
        setApiKey(decoded);
        setHasApiKey(true);
      } catch (e) {
        console.error("Failed to decode API key:", e);
      }
    }
  }, []);

  // Check auth and get user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
      } else {
        setUserEmail(user.email || "");
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Check if user is near bottom of scroll area
  const isNearBottom = useCallback(() => {
    const scrollElement = scrollViewportRef.current || scrollRef.current;
    if (!scrollElement) return true; // If no scroll element found, assume we should scroll
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      // Try to find viewport if not already set
      if (!scrollViewportRef.current) {
        const scrollArea = document.querySelector('[data-slot="scroll-area"]');
        const viewport = scrollArea?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
        if (viewport) {
          scrollViewportRef.current = viewport;
        }
      }
      
      // Try viewport first, fallback to inner div if viewport not found
      const scrollElement = scrollViewportRef.current || scrollRef.current;
      if (!scrollElement) return;
      
      // Only auto-scroll if user is near bottom or if forced (e.g., when sending message)
      if (force) {
        // Force scroll - always scroll when forced
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth',
        });
        userHasScrolledRef.current = false;
      } else if (isNearBottom()) {
        // Auto-scroll only if user is near bottom
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'auto', // Use 'auto' during streaming for better performance
        });
        userHasScrolledRef.current = false;
      }
    });
  }, [isNearBottom]);

  // Find and attach to ScrollArea viewport
  useEffect(() => {
    const findViewport = () => {
      // Try to find the viewport - look for the one in the chat messages area
      const scrollArea = document.querySelector('[data-slot="scroll-area"]');
      const viewport = scrollArea?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
      if (viewport) {
        scrollViewportRef.current = viewport;
      }
    };
    
    // Try immediately and also after delays to ensure it's found
    findViewport();
    const timeoutId1 = setTimeout(findViewport, 100);
    const timeoutId2 = setTimeout(findViewport, 500);
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [messages.length]); // Re-run when messages change to ensure viewport is found

  // Handle scroll events to detect user interaction
  useEffect(() => {
    const scrollElement = scrollViewportRef.current || scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      // If user scrolls up significantly, mark that they've scrolled
      if (!isNearBottom()) {
        userHasScrolledRef.current = true;
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [isNearBottom]);

  // Auto-scroll when messages change (but respect user scroll)
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      scrollToBottom(false);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  const fetchDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // Force scroll to bottom when user sends a message
    setTimeout(() => scrollToBottom(true), 100);

    try {
      // Get API key from localStorage if available
      const storedKey = localStorage.getItem("gemini_api_key");
      let customApiKey = null;
      if (storedKey) {
        try {
          customApiKey = atob(storedKey);
        } catch (e) {
          console.error("Failed to decode API key:", e);
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          apiKey: customApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.isQuotaError) {
          toast.error("API Quota Exceeded", {
            description: "You've hit the rate limit for Google's Gemini API. Please try again in a few moments.",
            duration: 5000,
          });
        } else {
          toast.error("Failed to get response", {
            description: errorData.error || "An error occurred while processing your request.",
          });
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      // Force scroll when assistant message starts
      setTimeout(() => scrollToBottom(true), 150);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }
            try {
              // Parse JSON and extract text field
              const parsed = JSON.parse(data);
              const textChunk = parsed.text || data;
              assistantMessage += textChunk;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
              // Auto-scroll during streaming (respects user scroll)
              scrollToBottom(false);
            } catch {
              // If parsing fails, treat as plain text (fallback)
              assistantMessage += data;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
              // Auto-scroll during streaming (respects user scroll)
              scrollToBottom(false);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Don't add error message to chat, toast already shown
      setMessages((prev) => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("File Too Large", {
        description: "File size must be less than 2MB",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check document limit
    if (documents.length >= 2) {
      toast.error("Document Limit Reached", {
        description: "Maximum 2 documents allowed. Please delete a document first.",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isQuotaError) {
          toast.error("API Quota Exceeded", {
            description: "You've hit the rate limit for Google's Gemini API embeddings. Please try again in a few moments.",
            duration: 5000,
          });
        } else {
          toast.error("Upload Failed", {
            description: data.error || "Failed to upload file",
          });
        }
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Document Uploaded", {
        description: `Successfully uploaded ${file.name} (${data.chunks} chunks)`,
      });

      // Refresh document list
      await fetchDocuments();
    } catch (error) {
      // Error toast already shown above
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents?id=${docId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Delete Failed", {
          description: "Failed to delete document",
        });
        throw new Error("Failed to delete document");
      }

      toast.success("Document Deleted", {
        description: "Document removed successfully",
      });

      // Refresh document list
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleExportConversation = () => {
    if (messages.length === 0) {
      toast.error("No messages to export", {
        description: "Start a conversation first",
      });
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      messages: messages,
      documentCount: documents.length,
      documents: documents.map(doc => ({
        filename: doc.filename,
        chunkCount: doc.chunkCount,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smeai-conversation-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Conversation exported", {
      description: "Your conversation has been saved as JSON",
    });
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("API Key Required", {
        description: "Please enter your Gemini API key",
      });
      return;
    }

    try {
      // Encode API key to base64 before storing
      const encoded = btoa(apiKey.trim());
      localStorage.setItem("gemini_api_key", encoded);
      setHasApiKey(true);
      setIsApiKeyDialogOpen(false);
      toast.success("API Key Saved", {
        description: "Your API key has been saved securely",
      });
    } catch {
      toast.error("Failed to save API key", {
        description: "Please try again",
      });
    }
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setHasApiKey(false);
    setIsApiKeyDialogOpen(false);
    toast.success("API Key Removed", {
      description: "Using default API key",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-black relative overflow-hidden">
      {/* Floating Glass-like Navigation */}
      <TopNav 
        variant="chat"
        userEmail={userEmail}
        onApiKeyClick={() => setIsApiKeyDialogOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center pt-24 pb-4 px-4 overflow-hidden min-h-0">
        <Card className="w-full max-w-4xl h-[calc(100vh-8rem)] flex flex-col shadow-lg border border-gray-200">
          {/* Content Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 border-b border-border">
              {/* Uploaded Documents Section */}
              <div className="mb-4 border rounded-md p-2 bg-muted/30 min-h-[60px] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Uploaded Documents ({documents.length}/2)
                </span>
                <Button
                  onClick={handleExportConversation}
                  variant="ghost"
                  size="sm"
                  disabled={messages.length === 0}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title={messages.length === 0 ? "No messages to export" : "Export conversation"}
                >
                  <Download className="size-3.5 mr-1.5" />
                  Export as JSON
                </Button>
              </div>
              {isLoadingDocuments ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-7 w-28" />
                </div>
              ) : documents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-md text-sm border"
                    >
                      <FileText className="size-3.5" />
                      <span className="max-w-[150px] truncate">{doc.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        ({doc.chunkCount} chunks)
                      </span>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="ml-1 hover:text-destructive transition-colors"
                        title="Delete document"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-1">
                  No documents uploaded yet
                </p>
              )}
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0">
              <div ref={scrollRef} className={messages.length === 0 ? "flex items-center justify-center min-h-full px-6" : "space-y-4 p-6"}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 w-full">
                  <div className="size-20 rounded-full bg-linear-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 flex items-center justify-center mb-6">
                    <Sparkles className="size-10 text-white dark:text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">
                    Welcome to SMEAI
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                    Upload documents and ask questions to get expert answers
                    grounded in your data.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || documents.length >= 2}
                      className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                      <Upload className="size-4 mr-2" />
                      Upload Document
                    </Button>
                    <Button
                      onClick={() => {
                        setInput("What can you help me with?");
                        setTimeout(() => {
                          const inputElement = document.querySelector('input[placeholder="Ask your Subject Matter Expert..."]') as HTMLInputElement;
                          if (inputElement) {
                            inputElement.focus();
                          }
                        }, 100);
                      }}
                      variant="outline"
                    >
                      <MessageSquare className="size-4 mr-2" />
                      Try Example Question
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const isStreaming = idx === messages.length - 1 && msg.role === "assistant" && isLoading && msg.content === "";
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-black dark:bg-white">
                              <Bot className="size-4 text-white dark:text-black" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[80%] ${
                            msg.role === "user"
                              ? "bg-black dark:bg-white text-white dark:text-black"
                              : "bg-gray-100 dark:bg-gray-900"
                          }`}
                        >
                          {isStreaming ? (
                            <div className="flex flex-col gap-2 py-1">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-5/6" />
                            </div>
                          ) : msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-xl font-semibold mt-4 mb-2">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>,
                                  ul: ({ children }) => <ul className="list-disc ml-6 my-3 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal ml-6 my-3 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="my-1">{children}</li>,
                                  code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                        {children}
                                      </code>
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  pre: ({ children }) => (
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                                      {children}
                                    </pre>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-4 text-muted-foreground">
                                      {children}
                                    </blockquote>
                                  ),
                                  a: ({ children, href }) => (
                                    <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                                      {children}
                                    </a>
                                  ),
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  hr: () => <hr className="my-6 border-border" />,
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto my-4">
                                      <table className="w-full border-collapse">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  th: ({ children }) => (
                                    <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="border border-border px-4 py-2">
                                      {children}
                                    </td>
                                  ),
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-black dark:bg-white">
                              <User className="size-4 text-white dark:text-black" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  {isLoading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content !== "" && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-black dark:bg-white">
                          <Bot className="size-4 text-white dark:text-black" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg px-4 py-2 max-w-[80%] bg-gray-100 dark:bg-gray-900">
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" />
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-75" />
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-150" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </ScrollArea>

            {/* Input Area - Fixed to bottom */}
            <div className="flex gap-2 p-6 pb-1 border-t border-border bg-card">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.pdf,.json,.md"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || documents.length >= 2}
              variant="outline"
              size="icon"
              title={documents.length >= 2 ? "Maximum 2 documents reached" : "Upload document (max 2MB)"}
            >
              {isUploading ? (
                <div className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Upload className="size-4" />
              )}
            </Button>
            <Button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              variant="outline"
              size="icon"
              title="Clear chat"
            >
              <Trash2 className="size-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your Subject Matter Expert..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? "..." : "Send"}
            </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="size-5" />
              API Key
            </DialogTitle>
            <DialogDescription>
              Enter your Google Gemini API key to use your own quota. The key is stored locally and encoded for security.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-sm font-medium">
                Gemini API Key
              </label>
              <Textarea
                id="api-key"
                placeholder="Enter your API key here..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://ai.google.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            {hasApiKey && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  ✓ API key is currently saved
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {hasApiKey && (
              <Button
                variant="outline"
                onClick={handleRemoveApiKey}
                className="mr-auto"
              >
                Remove API Key
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsApiKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
