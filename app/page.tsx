"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, FileText, Zap, Shield, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/chat");
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error("Authentication Failed", {
          description: error.message || "Failed to sign in with Google",
        });
        throw error;
      }
    } catch (error) {
      console.error("Error signing in:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="border-b bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <Brain className="size-6 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white">
                  SMEAI
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Subject Matter Expert AI
                </p>
              </div>
            </div>
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isLoading ? "Loading..." : "Sign In"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-medium mb-6 border border-gray-200 dark:border-gray-800">
            <Sparkles className="size-4" />
            <span>Powered by Google Gemini & RAG Technology</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-black dark:text-white">
            Your AI-Powered
            <br />
            Subject Matter Expert
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Transform your documents into expert knowledge. Upload, ask, and get
            intelligent answers grounded in your data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              size="lg"
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-lg px-8 py-6"
            >
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  <svg className="size-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                  <ArrowRight className="size-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="size-12 rounded-lg bg-black dark:bg-white flex items-center justify-center mb-4">
              <FileText className="size-6 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Document-Based RAG</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your PDFs, text files, and documents. SMEAI extracts,
              chunks, and vectorizes them for intelligent retrieval.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="size-12 rounded-lg bg-black dark:bg-white flex items-center justify-center mb-4">
              <Zap className="size-6 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Real-Time Streaming</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Experience modern AI chat with streaming responses. Get answers as
              they&apos;re generated, just like ChatGPT.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="size-12 rounded-lg bg-black dark:bg-white flex items-center justify-center mb-4">
              <Shield className="size-6 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your data stays secure with Google OAuth authentication. Documents
              are processed locally and stored safely.
            </p>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4">
        <div className="text-center text-gray-600 dark:text-gray-400">
          SMEAI - Built with ❤️
        </div>
      </footer>
    </div>
  );
}
