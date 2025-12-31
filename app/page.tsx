"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot, Upload, Trash2, FileText, X } from "lucide-react";

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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched documents:", data);
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add empty assistant message that will be streamed into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || "Failed to get response";
        
        // Show user-friendly message for quota errors
        if (response.status === 429 || errorData.isQuotaError) {
          throw new Error("⚠️ API Quota Exceeded\n\nYou've hit the rate limit for Google's Gemini API. This usually happens when you make too many requests in a short time.\n\nPlease wait a few moments and try again, or check your API quota at: https://ai.google.dev/gemini-api/docs/rate-limits");
        }
        
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                assistantContent += data.text;
                // Update the last message (assistant message) with accumulated content
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Try to get the error from the response if it's a fetch error
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: `${errorMessage}`,
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `File size exceeds 2MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
      setTimeout(() => setUploadError(null), 5000);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || "Failed to upload file";
        
        // Show user-friendly message for quota errors
        if (response.status === 429 || errorData.isQuotaError) {
          throw new Error("⚠️ API Quota Exceeded - You've hit the rate limit for Google's Gemini API embeddings. Please wait a few moments and try again.");
        }
        
        throw new Error(errorMsg);
      }

      const result = await response.json();
      setUploadSuccess(result.message || "File uploaded successfully!");
      
      // Refresh documents list
      await fetchDocuments();
      
      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload file"
      );
      // Clear error message after 10 seconds for quota errors (longer message)
      const timeout = error instanceof Error && error.message.includes("Quota") ? 10000 : 5000;
      setTimeout(() => setUploadError(null), timeout);
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
        const error = await response.json();
        throw new Error(error.error || "Failed to delete document");
      }

      // Refresh documents list
      await fetchDocuments();
      setUploadSuccess("Document deleted successfully!");
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error("Error deleting document:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to delete document"
      );
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <main className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl p-4 flex flex-col h-[600px] overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,.md,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading || documents.length >= 2}
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading || documents.length >= 2}
                className="cursor-pointer"
                asChild
                title={documents.length >= 2 ? "Maximum 2 documents allowed" : "Upload document (max 2MB)"}
              >
                <span>
                  <Upload className="size-4 mr-2" />
                  {isUploading ? "Uploading..." : documents.length >= 2 ? "Max 2 docs" : "Upload"}
                </span>
              </Button>
            </label>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                disabled={isLoading}
              >
                <Trash2 className="size-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Uploaded Documents Section */}
        <div className="mb-2 border rounded-md p-2 bg-muted/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              Uploaded Documents ({documents.length}/2)
            </span>
          </div>
          {documents.length > 0 ? (
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
            <p className="text-xs text-muted-foreground text-center py-2">
              No documents uploaded yet. Upload a document to get started.
            </p>
          )}
        </div>
        
        {(uploadError || uploadSuccess) && (
          <div
            className={`mb-2 p-2 rounded-md text-sm ${
              uploadError
                ? "bg-destructive/10 text-destructive"
                : "bg-green-500/10 text-green-600 dark:text-green-400"
            }`}
          >
            {uploadError || uploadSuccess}
          </div>
        )}
        <ScrollArea className="flex-1 min-h-0 mb-4 border rounded-md">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Start a conversation by typing a message below
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <Bot className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content ? (
                      message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-2 ml-4 list-disc last:mb-0">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-2 ml-4 list-decimal last:mb-0">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-sm">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-muted-foreground/20 p-2 rounded text-sm overflow-x-auto">
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => (
                                <pre className="mb-2 last:mb-0 overflow-x-auto">
                                  {children}
                                </pre>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">
                                  {children}
                                </h3>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic mb-2">
                                  {children}
                                </blockquote>
                              ),
                              a: ({ children, href }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      )
                    ) : (
                      <span className="text-muted-foreground animate-pulse">
                        Thinking...
                      </span>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
