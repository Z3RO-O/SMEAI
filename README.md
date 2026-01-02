# SMEAI

**Subject Matter Expert AI**  
_RAG-powered Subject Matter Expert AI built with Next.js & Gemini_

---

## 🧠 What is SMEAI?

SMEAI transforms your documents into an AI-powered subject matter expert. Upload your documents, ask questions, and get expert answers grounded in your data.

**Key Features:**
- 📄 **Document-Based RAG** — Upload PDFs, TXT, JSON, MD files
- 🤖 **Gemini-Powered Responses** — Streaming AI answers using Google's Gemini 2.5 Flash
- 🔑 **Custom API Keys** — Use your own Gemini API key for personal quota
- 🔍 **Semantic Search** — Vector embeddings for intelligent context retrieval
- 🔒 **Secure Authentication** — Google OAuth via Supabase
- ⚡ **Real-Time Streaming** — Modern chat experience with SSE
- 🎨 **Beautiful UI** — Built with Next.js 16, Tailwind CSS & shadcn/ui
- 📤 **Export Conversations** — Download chat history as JSON

---

## 🏗️ Architecture

```
Documents → Text Extraction → Chunking → Vector Embeddings → 
  → Semantic Search → Context Injection → Gemini → SMEAI Response
```

**Tech Stack:**
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui, Lucide Icons, react-markdown
- **AI/ML:** Google Gemini 2.5 Flash, LangChain, Custom Vector Store
- **Auth:** Supabase (Google OAuth) with SSR support
- **Notifications:** Sonner (toast notifications)
- **Deployment:** Vercel-ready

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Google Gemini API Key ([Get one here](https://ai.google.dev/))
- Supabase Project ([Create one](https://supabase.com/dashboard))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/smeai.git
cd smeai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Configure Supabase Authentication**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google OAuth
   - Add your site URL and redirect URL in Site URL settings
   - Add authorized redirect URLs:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://yourdomain.com/auth/callback`

5. **Run the development server**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)**

---

## 📖 Usage

### 1. Sign In
- Click "Sign in with Google" on the landing page
- Authenticate via Supabase

### 2. Upload Documents
- Click the upload button (📎 icon)
- Select a document (TXT, PDF, JSON, MD)
- Maximum 2 documents, 2MB each
- Documents are chunked and vectorized automatically

### 3. Ask Questions
- Type your question in the chat input
- SMEAI retrieves relevant context from your documents
- Receives streaming AI responses grounded in your data
- Press Enter to send, Shift+Enter for new line

### 4. Manage Documents
- View uploaded documents with chunk counts
- Delete documents with the ❌ icon
- Maximum 2 documents to keep the system lightweight

### 5. Custom API Key (Optional)
- Click the "API key" button in the top navigation
- Enter your own Gemini API key to use your personal quota
- Key is stored locally and encoded for security
- Remove it anytime to use the default server API key

### 6. Export Conversations
- Click "Export as JSON" to download your chat history
- Includes messages, document count, and metadata

---

## 📁 Project Structure

```
smeai/
├── app/
│   ├── auth/
│   │   └── callback/        # OAuth callback handler
│   ├── chat/                # Chat interface (protected)
│   ├── api/
│   │   ├── chat/            # Streaming chat endpoint
│   │   ├── documents/       # Document management (GET/DELETE)
│   │   └── upload/          # Document upload & ingestion
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── lib/
│   ├── ai/
│   │   └── gemini.ts        # Gemini AI configuration
│   ├── rag/
│   │   └── vector.ts        # Vector store & embeddings
│   └── supabase/
│       ├── client.ts        # Supabase client (browser)
│       ├── server.ts        # Supabase server client
│       └── proxy.ts         # Auth middleware/proxy
├── components/
│   ├── common/
│   │   └── TopNav.tsx       # Navigation component
│   ├── Prism.tsx            # Animated background component
│   └── ui/                  # shadcn/ui components
├── proxy.ts                 # Next.js middleware entry
├── vector_store.json        # Persistent vector storage (gitignored)
└── README.md
```

---

## 🔐 Authentication Flow

1. User lands on `/` (landing page)
2. Clicks "Sign in with Google"
3. Redirects to Supabase OAuth
4. Returns to `/auth/callback`
5. Redirects to `/chat` (protected route)
6. Authenticated users can access chat and upload documents

---

## 🧩 How RAG Works

### Document Ingestion
1. Upload document via `/api/upload`
2. Extract text content
3. Split into chunks (1000 chars, 200 overlap)
4. Generate embeddings using Gemini
5. Store in persistent vector store

### Query & Retrieval
1. User asks a question
2. Question is embedded using Gemini embeddings
3. Semantic similarity search finds top 3 relevant chunks
4. Context is injected into Gemini 2.5 Flash prompt
5. Gemini generates answer based on provided context
6. Response streams to client in real-time via SSE
7. Custom API keys are supported (stored in localStorage, encoded)

---

## 🎨 UI Features

### Current Features
- ✅ Clean, modern chat interface with animated Prism background
- ✅ SMEAI branding with Brain icon and glass-morphism navigation
- ✅ Avatar-based message distinction (User/Bot)
- ✅ Rich markdown rendering for AI responses (code blocks, lists, tables)
- ✅ Auto-scrolling chat area with user scroll detection
- ✅ Fixed input area at bottom
- ✅ Document upload with progress indicators
- ✅ Document management (view chunk counts, delete)
- ✅ Toast notifications for all actions (Sonner)
- ✅ Error handling and loading states
- ✅ Empty state with example question prompt
- ✅ Export conversation as JSON
- ✅ Custom API key management dialog
- ✅ Clear chat functionality
- ✅ Mobile-responsive design

---

## 🚀 Deployment

### Deploy to Vercel

1. **Connect your repository to Vercel**

2. **Add environment variables in Vercel Dashboard:**
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Update Supabase redirect URLs:**
   - Add your Vercel domain to authorized redirect URLs

4. **Deploy:**
```bash
npm run build
```

The `vercel.json` is configured to handle all routing correctly.

---

## ⚙️ Configuration

### Vector Store
- **Storage:** File-based (`vector_store.json`)
- **Persistence:** Survives server restarts
- **Embeddings:** Gemini Embedding API (`gemini-embedding-001`)
- **Similarity:** Cosine similarity calculation
- **Scalability:** For production, migrate to Pinecone, Supabase Vector, or Weaviate

### Document Limits
- **Max documents:** 2
- **Max file size:** 2MB per document
- **Supported formats:** TXT, PDF, JSON, MD

### Chunking Strategy
- **Chunk size:** 1000 characters
- **Overlap:** 200 characters
- **Splitter:** LangChain Recursive Character Text Splitter
- **Metadata:** Each chunk tagged with document ID and filename

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
npm run lint:fix     # Auto-fix linting issues
```

### Adding UI Components
```bash
npx shadcn@latest add [component-name]
```

---

## 🧪 Troubleshooting

### Issue: "Found relevant docs: 0"
- **Cause:** Vector store not persisting or documents not uploaded
- **Fix:** Check `vector_store.json` exists and contains data

### Issue: 429 Rate Limit Error
- **Cause:** Gemini API quota exceeded
- **Fix:** Wait for quota reset or upgrade API plan

### Issue: Authentication not working
- **Cause:** Missing or incorrect Supabase credentials
- **Fix:** Verify `.env.local` and Supabase dashboard settings

### Issue: Route not found on Vercel
- **Cause:** Missing routing configuration
- **Fix:** Ensure `vercel.json` is present and configured correctly

### Issue: Custom API key not working
- **Cause:** API key not properly encoded or invalid
- **Fix:** Check that the API key is valid and try saving it again. The key is base64 encoded in localStorage.

---

## 📝 License

MIT License - feel free to use this project for learning and production.

---

## 🙏 Acknowledgments

- **Google Gemini** for powerful AI capabilities (Gemini 2.5 Flash & Embeddings)
- **LangChain** for RAG tooling and text splitting
- **Supabase** for seamless authentication with SSR support
- **shadcn/ui** for beautiful, accessible components
- **Sonner** for elegant toast notifications
- **Vercel** for effortless deployment

---

## 📬 Contact

Built with ❤️ for creating domain-specific AI experts.

For questions or contributions, open an issue or pull request!

---

**SMEAI** — _Your AI-powered Subject Matter Expert._
