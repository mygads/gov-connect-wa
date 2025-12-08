# Vector Database Architecture

## Overview

AI Service memiliki database sendiri (`gc_ai`) untuk menyimpan vector embeddings. Ini memisahkan tanggung jawab antara Dashboard (metadata) dan AI Service (vectors).

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                │
│  - Metadata dokumen (list, tambah, hapus)                       │
│  - UI untuk manage knowledge                                     │
│  - Call AI Service untuk operasi vector                         │
│  - Database: gc_dashboard (schema: dashboard)                   │
│    - knowledge_base (tanpa embedding)                           │
│    - knowledge_documents                                         │
│    - document_chunks (tanpa embedding)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP API
┌─────────────────────────────────────────────────────────────────┐
│                         AI SERVICE                               │
│  - Generate embedding (Gemini API)                              │
│  - Vector storage (pgvector)                                     │
│  - Vector search (cosine similarity)                            │
│  - RAG processing                                                │
│  - Database: gc_ai (schema: ai_vectors)                         │
│    - knowledge_vectors                                           │
│    - document_vectors                                            │
│    - embedding_jobs                                              │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Knowledge Vectors

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/knowledge` | Add knowledge + generate embedding |
| PUT | `/api/knowledge/:id` | Update knowledge (re-embed) |
| DELETE | `/api/knowledge/:id` | Delete knowledge vector |
| GET | `/api/knowledge/:id` | Get knowledge vector |
| POST | `/api/knowledge/search` | Vector search |

### Document Vectors

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Add document chunks + embeddings |
| PUT | `/api/documents/:id` | Update document (re-embed all chunks) |
| DELETE | `/api/documents/:id` | Delete all document vectors |
| POST | `/api/documents/search` | Vector search in documents |

### Unified Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Combined search (knowledge + documents) |
| GET | `/api/search/stats` | Vector DB statistics |

## Flow: Create Knowledge

```
1. Admin creates knowledge in Dashboard UI
2. Dashboard saves metadata to dashboard.knowledge_base
3. Dashboard calls AI Service: POST /api/knowledge
4. AI Service generates embedding via Gemini API
5. AI Service stores vector in ai_vectors.knowledge_vectors
```

## Flow: Update Knowledge

```
1. Admin updates knowledge in Dashboard UI
2. Dashboard updates metadata in dashboard.knowledge_base
3. Dashboard calls AI Service: PUT /api/knowledge/:id
4. AI Service generates NEW embedding (re-embed)
5. AI Service replaces vector in ai_vectors.knowledge_vectors
```

## Flow: Delete Knowledge

```
1. Admin deletes knowledge in Dashboard UI
2. Dashboard deletes from dashboard.knowledge_base
3. Dashboard calls AI Service: DELETE /api/knowledge/:id
4. AI Service deletes from ai_vectors.knowledge_vectors
```

## Flow: RAG Query

```
1. User sends message via WhatsApp
2. AI Service receives message
3. AI Service generates query embedding
4. AI Service searches ai_vectors.knowledge_vectors + document_vectors
5. AI Service builds context from top results
6. AI Service sends context + query to LLM
7. AI Service returns response
```

## Database Setup

Database `gc_ai` dibuat otomatis oleh init script di `/database/init/01-init-databases.sql`.

1. Start database container:
   ```bash
   cd database
   docker compose up -d
   ```

2. Run migration (jika database sudah ada):
   ```bash
   cd govconnect-ai-service
   psql -h localhost -p 5433 -U postgres -d gc_ai -f prisma/migrations/init_vector_db.sql
   ```

3. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

4. Atau gunakan Prisma push:
   ```bash
   npm run db:push
   ```

## Environment Variables

```env
# AI Service database (separate database gc_ai)
# Local Dev: localhost:5433 (mapped port)
# Docker: postgres:5432
AI_DATABASE_URL=postgresql://postgres:password@localhost:5433/gc_ai?schema=ai_vectors
```

## Endpoint Summary

### Dashboard API (untuk Admin UI)
- `GET/POST /api/knowledge` - CRUD knowledge (Bearer token)
- `GET/PUT/DELETE /api/knowledge/:id` - Single knowledge ops
- `GET/POST /api/documents` - CRUD documents
- `DELETE /api/documents/:id` - Delete document

### Dashboard Internal API (untuk AI Service)
- `GET /api/internal/knowledge` - Fetch all knowledge
- `GET /api/internal/knowledge/:id` - Fetch single knowledge
- `GET /api/internal/documents/:id/chunks` - Fetch document chunks
- `PUT /api/internal/documents/:id` - Update document status

### AI Service API (untuk Vector Operations)
- `POST/PUT/DELETE /api/knowledge/:id` - Vector CRUD
- `POST/PUT/DELETE /api/documents/:id` - Document vector CRUD
- `POST /api/search` - Unified vector search
