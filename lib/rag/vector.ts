import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY!,
  modelName: "gemini-embedding-001",
});

export interface UploadedDocument {
  id: string;
  filename: string;
  uploadedAt: Date;
  chunkCount: number;
}

interface SerializedDocument {
  pageContent: string;
  metadata: Record<string, string | number | boolean | null>;
}

interface StoreData {
  documents: SerializedDocument[];
  uploadedDocs: Array<[string, UploadedDocument]>;
}

// Simple persistent vector store with document tracking
class SimpleVectorStore {
  private documents: Document[] = [];
  private embeddings: GoogleGenerativeAIEmbeddings;
  private uploadedDocs: Map<string, UploadedDocument> = new Map();
  private persistPath: string;

  constructor(embeddings: GoogleGenerativeAIEmbeddings, persistPath: string = "./vector_store.json") {
    this.embeddings = embeddings;
    this.persistPath = persistPath;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = fs.readFileSync(this.persistPath, "utf-8");
        const parsed: StoreData = JSON.parse(data);
        
        // Restore documents
        this.documents = parsed.documents.map(
          (doc) => new Document({ pageContent: doc.pageContent, metadata: doc.metadata })
        );
        
        // Restore uploaded docs map
        this.uploadedDocs = new Map(
          parsed.uploadedDocs.map(([id, doc]) => [
            id,
            { ...doc, uploadedAt: new Date(doc.uploadedAt) },
          ])
        );
        
        console.log(`Loaded ${this.documents.length} documents from disk`);
      }
    } catch (error) {
      console.error("Error loading vector store:", error);
    }
  }

  private save(): void {
    try {
      const data: StoreData = {
        documents: this.documents.map((doc) => ({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        })),
        uploadedDocs: Array.from(this.uploadedDocs.entries()),
      };
      
      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`Saved ${this.documents.length} documents to disk`);
    } catch (error) {
      console.error("Error saving vector store:", error);
    }
  }

  async addDocuments(docs: Document[], metadata: { id: string; filename: string }): Promise<void> {
    // Tag each document chunk with the parent document ID
    const taggedDocs = docs.map((doc) => {
      // Create a new Document with proper metadata
      return new Document({
        pageContent: doc.pageContent,
        metadata: { 
          ...doc.metadata, 
          docId: metadata.id,
          filename: metadata.filename 
        },
      });
    });
    
    this.documents.push(...taggedDocs);
    
    console.log(`Added ${taggedDocs.length} chunks for document: ${metadata.filename}`);
    console.log(`Total documents in store: ${this.documents.length}`);
    console.log(`Sample document metadata:`, taggedDocs[0]?.metadata);
    
    // Track the uploaded document
    this.uploadedDocs.set(metadata.id, {
      id: metadata.id,
      filename: metadata.filename,
      uploadedAt: new Date(),
      chunkCount: docs.length,
    });
    
    // Persist to disk
    this.save();
  }

  deleteDocument(docId: string): boolean {
    // Remove all chunks belonging to this document
    const beforeCount = this.documents.length;
    this.documents = this.documents.filter((doc) => doc.metadata?.docId !== docId);
    
    // Remove from tracked documents
    const deleted = this.uploadedDocs.delete(docId);
    
    const afterCount = this.documents.length;
    console.log(`Deleted ${beforeCount - afterCount} chunks for document ${docId}`);
    
    // Persist to disk
    this.save();
    
    return deleted && this.documents.length < beforeCount;
  }

  listDocuments(): UploadedDocument[] {
    return Array.from(this.uploadedDocs.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  getDocumentCount(): number {
    return this.uploadedDocs.size;
  }

  async similaritySearch(query: string, k: number = 3): Promise<Document[]> {
    console.log(`Similarity search - Total documents in store: ${this.documents.length}`);
    
    if (this.documents.length === 0) {
      console.log("No documents in store, returning empty array");
      return [];
    }

    // Embed the query
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Embed all documents (in production, you'd cache these)
    const docEmbeddings = await Promise.all(
      this.documents.map((doc) => this.embeddings.embedQuery(doc.pageContent))
    );

    // Calculate cosine similarity
    const similarities = docEmbeddings.map((docEmbed, idx) => {
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbed);
      return { index: idx, similarity };
    });

    // Sort by similarity and return top k
    const topK = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    return topK.map((item) => this.documents[item.index]);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

let vectorStore: SimpleVectorStore | null = null;

export async function getVectorStore(): Promise<SimpleVectorStore> {
  if (!vectorStore) {
    // Use file-based persistent vector store
    // Data is stored in vector_store.json and persists across restarts
    // For production at scale, consider using a managed vector DB like Pinecone, Supabase, or Weaviate
    vectorStore = new SimpleVectorStore(embeddings, "./vector_store.json");
  }
  return vectorStore;
}

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
