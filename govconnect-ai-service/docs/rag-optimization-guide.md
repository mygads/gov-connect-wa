# 🚀 GovConnect RAG System - Optimization Guide

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsApp Message                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  AI Orchestrator (processMessage)                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Step 1: Pre-fetch RAG (if looks like question)            │  │
│  │         shouldRetrieveContext(message) → getRAGContext()  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Step 2: Build Context (history + knowledge if pre-loaded) │  │
│  │         buildContext(user, message, knowledgeContext?)    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                         ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Step 3: Single LLM Call (with knowledge already injected) │  │
│  │         Gemini → Intent + Answer in one call!             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## ✅ Optimizations Implemented

### 1. Pre-fetch RAG Context
**Before:** 2 LLM calls for knowledge queries
```
LLM Call 1 → Detect intent: KNOWLEDGE_QUERY
LLM Call 2 → Answer with fetched knowledge
```

**After:** 1 LLM call with pre-fetched knowledge
```
Pre-fetch knowledge (if question-like) → 1 LLM Call → Direct answer
```

**Benefit:** ~50% latency reduction for knowledge queries

### 2. Hybrid Search (Vector + Keyword)
- Primary: pgvector cosine similarity
- Fallback: In-memory keyword search
- Re-ranking: Boost exact matches and keyword overlap

### 3. Vector Cache
- In-memory cache with 5-minute TTL
- Auto-refresh on stale
- Reduces database queries for repeated similar questions

## 📋 Saran Optimisasi Lanjutan

### 1. Embedding Cache (High Priority)
**Problem:** Setiap query menghasilkan embedding baru via API call ke Gemini.

**Solution:** Cache query embeddings untuk queries yang mirip.

```typescript
// Add to embedding.service.ts
import crypto from 'crypto';

const embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
const EMBEDDING_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

function getQueryHash(query: string): string {
  return crypto.createHash('md5').update(normalizeQuery(query)).digest('hex');
}

export async function generateEmbeddingCached(
  text: string,
  options?: EmbeddingOptions
): Promise<EmbeddingResult> {
  const hash = getQueryHash(text);
  const cached = embeddingCache.get(hash);
  
  if (cached && Date.now() - cached.timestamp < EMBEDDING_CACHE_TTL) {
    return { values: cached.embedding, model: 'cached' };
  }
  
  const result = await generateEmbedding(text, options);
  embeddingCache.set(hash, { embedding: result.values, timestamp: Date.now() });
  
  return result;
}
```

### 2. Contextual Re-ranking (Medium Priority)
**Problem:** Re-ranking hanya berdasarkan keyword match, tidak memahami konteks.

**Solution:** Cross-encoder untuk re-ranking yang lebih akurat.

```typescript
// Bisa menggunakan model sentence-transformers/ms-marco-MiniLM-L-6-v2
// atau fine-tuned Indonesian model untuk re-ranking
async function crossEncoderRerank(
  query: string,
  results: VectorSearchResult[]
): Promise<VectorSearchResult[]> {
  // Call reranker API atau local model
  const scored = await Promise.all(
    results.map(async r => ({
      ...r,
      rerankedScore: await getRelevanceScore(query, r.content)
    }))
  );
  return scored.sort((a, b) => b.rerankedScore - a.rerankedScore);
}
```

### 3. Query Expansion (Medium Priority)
**Problem:** User query mungkin berbeda vocabulary dengan knowledge base.

**Solution:** Expand query dengan sinonim/related terms.

```typescript
const synonymMap: Record<string, string[]> = {
  'jam buka': ['waktu operasional', 'jadwal kerja', 'jam kerja'],
  'kantor': ['gedung', 'balai', 'tempat'],
  'surat': ['dokumen', 'berkas', 'formulir'],
  'domisili': ['tempat tinggal', 'alamat', 'kediaman'],
};

function expandQuery(query: string): string {
  let expanded = query;
  for (const [term, synonyms] of Object.entries(synonymMap)) {
    if (query.toLowerCase().includes(term)) {
      expanded += ' ' + synonyms.join(' ');
    }
  }
  return expanded;
}
```

### 4. Chunking Strategy Improvement (High Priority)
**Current:** Fixed size chunks (1000 chars dengan 200 overlap)

**Better:** Semantic chunking berdasarkan paragraph/section.

```typescript
// di document-processor.service.ts
function semanticChunking(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const para of paragraphs) {
    // If adding this para exceeds limit, save current and start new
    if (currentChunk.length + para.length > MAX_CHUNK_SIZE) {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          metadata: { type: 'paragraph' }
        });
      }
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }
  
  // Don't forget last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex++,
      metadata: { type: 'paragraph' }
    });
  }
  
  return chunks;
}
```

### 5. Knowledge Quality Scoring (Low Priority)
**Problem:** Semua knowledge punya bobot sama.

**Solution:** Add quality/trust score per knowledge item.

```prisma
// schema.prisma update
model knowledge_base {
  // ... existing fields
  quality_score   Float     @default(1.0)  // 0.0 - 1.0
  usage_count     Int       @default(0)    // Track how often it's retrieved
  last_retrieved  DateTime?                // Track last usage
  feedback_score  Float?                   // User feedback if implemented
}
```

### 6. Async Embedding Updates (Low Priority)
**Problem:** Embedding regeneration blocks UI.

**Solution:** Background job untuk update embeddings.

```typescript
// worker/embedding-worker.ts
import { Queue, Worker } from 'bullmq';

const embeddingQueue = new Queue('embedding-jobs');

// Producer
export async function queueEmbeddingJob(
  type: 'knowledge' | 'document',
  id: string
) {
  await embeddingQueue.add('generate-embedding', { type, id });
}

// Consumer (run in separate process)
const worker = new Worker('embedding-jobs', async (job) => {
  const { type, id } = job.data;
  
  if (type === 'knowledge') {
    await regenerateKnowledgeEmbedding(id);
  } else {
    await regenerateDocumentChunkEmbeddings(id);
  }
});
```

## 📊 Metrics to Track

### Response Quality
- **RAG Hit Rate:** % queries yang menemukan relevant knowledge
- **User Satisfaction:** Feedback score pada respons
- **Fallback Rate:** % yang jatuh ke "tidak ada informasi"

### Performance
- **P95 Latency:** Target < 3 detik end-to-end
- **Embedding Latency:** Target < 500ms
- **Vector Search Latency:** Target < 100ms

### System Health
- **Cache Hit Rate:** Target > 60%
- **LLM Token Usage:** Monitor untuk cost control
- **Error Rate:** Target < 1%

## 🔧 Configuration Recommendations

```env
# govconnect-ai-service/.env

# RAG Settings
USE_RAG_SEARCH=true
RAG_TOP_K=5
RAG_MIN_SCORE=0.65
RAG_PREFETCH_ENABLED=true

# Vector Cache
VECTOR_CACHE_TTL_MS=300000
EMBEDDING_CACHE_TTL_MS=1800000

# LLM Settings
GEMINI_TEMPERATURE=0.3
MAX_HISTORY_MESSAGES=30
MAX_CONTEXT_LENGTH=4000

# Performance
LLM_TIMEOUT_MS=30000
VECTOR_SEARCH_TIMEOUT_MS=10000
```

## 🎯 Priority Implementation Order

1. **✅ DONE:** Pre-fetch RAG context for questions
2. **✅ DONE:** Embedding cache untuk reduce API calls (30min TTL, max 500 entries)
3. **✅ DONE:** Semantic chunking untuk documents (paragraph-based)
4. **✅ DONE:** Query expansion dengan sinonim (50+ Indonesian synonym mappings)
5. **✅ DONE:** Background embedding worker (in-memory job queue)
6. **✅ DONE:** Knowledge quality scoring (usage tracking + feedback)

## 📚 Related Docs

- [RAG Service](../src/services/rag.service.ts)
- [Knowledge Service](../src/services/knowledge.service.ts)
- [Embedding Service](../src/services/embedding.service.ts)
- [Vector Store Service](../src/services/vector-store.service.ts)
