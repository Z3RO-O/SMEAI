export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getVectorStore, textSplitter } from "@/lib/rag/vector";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file size (2MB limit)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 2MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Get vector store and check document limit
    const vectorStore = await getVectorStore();
    const currentCount = vectorStore.getDocumentCount();
    
    // Enforce 2-document limit
    if (currentCount >= 2) {
      return NextResponse.json(
        { error: "Maximum 2 documents allowed. Please delete a document before uploading a new one." },
        { status: 400 }
      );
    }

    // Extract text from file
    let text: string;
    const fileType = file.type || file.name.split(".").pop()?.toLowerCase();

    if (fileType === "text/plain" || fileType === "txt") {
      text = await file.text();
    } else if (fileType === "application/json" || fileType === "json") {
      const json = JSON.parse(await file.text());
      text = typeof json === "string" ? json : JSON.stringify(json, null, 2);
    } else {
      // For other file types, try to read as text
      // In production, you'd want to use proper parsers for PDF, DOCX, etc.
      text = await file.text();
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "File appears to be empty or could not be parsed" },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = await textSplitter.createDocuments([text]);

    // Generate unique document ID
    const docId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Add documents to vector store with metadata
    await vectorStore.addDocuments(chunks, {
      id: docId,
      filename: file.name,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${chunks.length} chunks from ${file.name}`,
      chunks: chunks.length,
      documentId: docId,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    
    // Check if it's a quota exceeded error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Too Many Requests")) {
      return NextResponse.json(
        { 
          error: "API quota exceeded. You've hit the rate limit for Google's Gemini API embeddings. Please try again in a few moments or check your API key quota at https://ai.google.dev/gemini-api/docs/rate-limits",
          isQuotaError: true
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process file", details: errorMessage },
      { status: 500 }
    );
  }
}

