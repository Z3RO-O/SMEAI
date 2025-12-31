export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/rag/vector";

// GET - List all uploaded documents
export async function GET() {
  try {
    const vectorStore = await getVectorStore();
    const documents = vectorStore.listDocuments();

    return NextResponse.json({
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Error listing documents:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a document by ID
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("id");

    if (!docId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const vectorStore = await getVectorStore();
    const deleted = vectorStore.deleteDocument(docId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

