"use client";

import { Brain, Github, Key, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  variant?: "landing" | "chat";
  userEmail?: string;
  onApiKeyClick?: () => void;
  onSignOut?: () => void;
}

export function TopNav({ 
  variant = "landing", 
  userEmail,
  onApiKeyClick,
  onSignOut 
}: TopNavProps) {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-full border shadow-lg shadow-white/10 border-white/10 backdrop-blur-md bg-black/30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-lg backdrop-blur-sm border flex items-center justify-center ${
              "bg-white/10 border-white/20"
            }`}>
              <Brain className={`size-6 text-white`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold text-white`}>
                SMEAI
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {variant === "chat" && userEmail && (
              <span className="text-sm text-white hidden sm:inline">{userEmail}</span>
            )}
            
            {variant === "chat" && onApiKeyClick && (
              <Button
                onClick={onApiKeyClick}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white rounded-full"
                title="Add Gemini API key"
              >
                <Key className="size-4 mr-2" />
                <span className="hidden sm:inline">API key</span>
              </Button>
            )}
            
            {variant === "chat" && onSignOut && (
              <Button
                onClick={onSignOut}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white rounded-full"
              >
                <LogOut className="size-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
            
            {variant === "landing" && (
              <a
                href="https://github.com/Z3RO-O/smeai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                <Github className="size-4" />
                <span>GitHub</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

