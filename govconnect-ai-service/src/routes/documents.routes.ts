/**
 * Document Vector API Routes
 * 
 * Handles CRUD operations for document chunk vectors
 * Called by Dashboard when admin uploads/deletes documents
 * 
 * Endpoints:
 * - POST   /api/documents              - Add document chunks + embeddings
 * - PUT    /api/documents/:id          - Update document (re-embed all chunks)
 * - DELETE /api/documents/:id          - Delete all document vectors
 * - POST   /api/documents/search       - Vector search in documents
 */

import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import { config } from '../config/env';
import { generateBatchEmbeddings } from '../services/embedding.service';
import {
  addDocumentChunks,
  deleteDocumentVectors,
  searchVectors,
  DocumentChunkInput,
} from '../services/vector-db.service';

const router = Router();

// Middleware to verify internal API key
function verifyInternalKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-internal-api-key'];
  if (!apiKey || apiKey !== config.internalApiKey) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(verifyInternalKey);

/**
 * POST /api/documents
 * Add document with chunks and generate embeddings
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { documentId, documentTitle, category, chunks } = req.body;

    if (!documentId || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: documentId, chunks (array)' 
      });
    }

    logger.info('Adding document vectors', { 
      documentId, 
      chunkCount: chunks.length 
    });

    // Extract content from chunks for batch embedding
    const contents = chunks.map((c: any) => c.content);

    // Generate embeddings in batch
    const batchResult = await generateBatchEmbeddings(contents, {
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    });

    // Prepare chunks with embeddings
    const chunksWithEmbeddings: DocumentChunkInput[] = chunks.map((chunk: any, idx: number) => ({
      documentId,
      chunkIndex: chunk.chunkIndex ?? idx,
      content: chunk.content,
      embedding: batchResult.embeddings[idx].values,
      documentTitle: documentTitle || chunk.documentTitle,
      category: category || chunk.category,
      pageNumber: chunk.pageNumber,
      sectionTitle: chunk.sectionTitle,
      embeddingModel: batchResult.embeddings[idx].model,
    }));

    // Store in vector DB
    await addDocumentChunks(chunksWithEmbeddings);

    res.status(201).json({
      status: 'success',
      data: {
        documentId,
        chunksProcessed: chunks.length,
        embeddingDimensions: batchResult.embeddings[0]?.dimensions,
        processingTimeMs: batchResult.processingTimeMs,
      },
    });
  } catch (error: any) {
    logger.error('Failed to add document', { error: error.message });
    res.status(500).json({ error: 'Failed to add document vectors' });
  }
});

/**
 * PUT /api/documents/:id
 * Update document (delete old chunks + add new = re-embed)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const { documentTitle, category, chunks } = req.body;

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required field: chunks (array)' 
      });
    }

    logger.info('Updating document vectors', { 
      documentId, 
      chunkCount: chunks.length 
    });

    // Delete old vectors first
    await deleteDocumentVectors(documentId);

    // Generate new embeddings
    const contents = chunks.map((c: any) => c.content);
    const batchResult = await generateBatchEmbeddings(contents, {
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    });

    // Prepare chunks with embeddings
    const chunksWithEmbeddings: DocumentChunkInput[] = chunks.map((chunk: any, idx: number) => ({
      documentId,
      chunkIndex: chunk.chunkIndex ?? idx,
      content: chunk.content,
      embedding: batchResult.embeddings[idx].values,
      documentTitle: documentTitle || chunk.documentTitle,
      category: category || chunk.category,
      pageNumber: chunk.pageNumber,
      sectionTitle: chunk.sectionTitle,
      embeddingModel: batchResult.embeddings[idx].model,
    }));

    // Store new vectors
    await addDocumentChunks(chunksWithEmbeddings);

    res.json({
      status: 'success',
      data: {
        documentId,
        chunksProcessed: chunks.length,
        embeddingDimensions: batchResult.embeddings[0]?.dimensions,
        processingTimeMs: batchResult.processingTimeMs,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update document', { error: error.message });
    res.status(500).json({ error: 'Failed to update document vectors' });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete all vectors for a document
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;

    logger.info('Deleting document vectors', { documentId });

    const deleted = await deleteDocumentVectors(documentId);

    res.json({ 
      status: 'success', 
      deleted,
      documentId,
    });
  } catch (error: any) {
    logger.error('Failed to delete document', { error: error.message });
    res.status(500).json({ error: 'Failed to delete document vectors' });
  }
});

/**
 * POST /api/documents/search
 * Vector search in documents
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, topK, minScore, categories } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    logger.info('Document vector search', { queryLength: query.length });

    // Generate query embedding
    const { generateEmbedding } = await import('../services/embedding.service');
    const queryEmbedding = await generateEmbedding(query, {
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
      useCache: true,
    });

    // Search vectors
    const results = await searchVectors(queryEmbedding.values, {
      topK: topK || 5,
      minScore: minScore || 0.7,
      categories,
      sourceTypes: ['document'],
    });

    res.json({
      data: results,
      total: results.length,
    });
  } catch (error: any) {
    logger.error('Document search failed', { error: error.message });
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
