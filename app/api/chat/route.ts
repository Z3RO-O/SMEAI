export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/ai/gemini";
import { getVectorStore } from "@/lib/rag/vector";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("Received message:", message);

    // Get vector store and retrieve relevant documents
    const vectorStore = await getVectorStore();
    const relevantDocs = await vectorStore.similaritySearch(message, 3);
    
    console.log("Found relevant docs:", relevantDocs.length);

    // Build context from retrieved documents
    let context = "";
    if (relevantDocs.length > 0) {
      context = relevantDocs
        .map((doc, idx) => `[Document ${idx + 1}]\n${doc.pageContent}`)
        .join("\n\n");
    }

    // Build prompt with context
    const prompt = context
      ? `You are a helpful assistant. Use the following context from uploaded documents to answer the question. If the context doesn't contain relevant information, use your general knowledge to answer.

Context:
${context}

Question: ${message}

Answer:`
      : message;

    console.log("Generating content with Gemini...");
    const result = await geminiModel.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
          console.log("Stream completed");
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    
    // Check if it's a quota exceeded error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Too Many Requests")) {
      return NextResponse.json(
        { 
          error: "API quota exceeded. You've hit the rate limit for Google's Gemini API. Please try again in a few moments or check your API key quota at https://ai.google.dev/gemini-api/docs/rate-limits",
          isQuotaError: true
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate response", details: errorMessage },
      { status: 500 }
    );
  }
}
