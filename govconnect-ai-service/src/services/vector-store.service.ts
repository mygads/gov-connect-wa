/**
 * Vector Store Service for GovConnect AI
 * 
 * Handles vector storage and search operations using pgvector
 * Communicates with Dashboard service which has access to PostgreSQL
 * 
 * Features:
 * - Store embeddings for knowledge base items
 * - Store embeddings for document chunks
 * - Semantic search using cosine similarity
 * - Hybrid search (vector + keyword)
 */

import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/env';
import {
  VectorSearchResult,
  VectorSearchOptions,
  EmbeddedKnowledge,
  EmbeddedChunk,
} from '../types/embedding.types';
import { cosineSimilarity } from './embedding.service';

// In-memory vector cache for fast search (optional, for small datasets)
interface VectorCache {
  knowledge: Map<string, { embedding: number[]; data: any }>;
  documents: Map<string, { embedding: number[]; data: any }>;
  lastUpdated: Date;
}

let vectorCache: VectorCache = {
  knowledge: new Map(),
  documents: new Map(),
  lastUpdated: new Date(0),
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Search for similar vectors in the knowledge base and documents
 * 
 * @param queryEmbedding - The query embedding vector
 * @param options - Search options
 * @returns Array of search results sorted by similarity
 */
export async function searchVectors(
  queryEmbedding: number[],
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> {
  const {
    topK = 5,
    minScore = 0.7,
    categories,
    sourceTypes = ['knowledge', 'document'],
  } = options;

  const startTime = Date.now();

  logger.debug('Starting vector search', {
    embeddingDims: queryEmbedding.length,
    topK,
    minScore,
    categories,
    sourceTypes,
  });

  try {
    // Try API-based search first (uses pgvector)
    const results = await searchViaAPI(queryEmbedding, options);
    
    const endTime = Date.now();
    logger.info('Vector search completed', {
      resultsFound: results.length,
      searchTimeMs: endTime - startTime,
    });

    return results;
  } catch (error: any) {
    logger.warn('API vector search failed, falling back to in-memory search', {
      error: error.message,
    });

    // Fallback to in-memory search
    return searchInMemory(queryEmbedding, options);
  }
}

/**
 * Search using Dashboard API (pgvector)
 */
async function searchViaAPI(
  queryEmbedding: number[],
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const {
    topK = 5,
    minScore = 0.7,
    categories,
    sourceTypes = ['knowledge', 'document'],
  } = options;

  const response = await axios.post<{ data: VectorSearchResult[] }>(
    `${config.dashboardServiceUrl}/api/internal/vector-search`,
    {
      embedding: queryEmbedding,
      topK,
      minScore,
      categories,
      sourceTypes,
    },
    {
      headers: {
        'x-internal-api-key': config.internalApiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return response.data.data || [];
}

/**
 * Search using in-memory cache (fallback)
 */
async function searchInMemory(
  queryEmbedding: number[],
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const {
    topK = 5,
    minScore = 0.7,
    categories,
    sourceTypes = ['knowledge', 'document'],
  } = options;

  // Refresh cache if stale
  if (Date.now() - vectorCache.lastUpdated.getTime() > CACHE_TTL_MS) {
    await refreshVectorCache();
  }

  const results: VectorSearchResult[] = [];

  // Search knowledge base
  if (sourceTypes.includes('knowledge')) {
    for (const [id, item] of vectorCache.knowledge.entries()) {
      // Filter by category if specified
      if (categories && categories.length > 0) {
        if (!categories.includes(item.data.category)) {
          continue;
        }
      }

      const score = cosineSimilarity(queryEmbedding, item.embedding);
      
      if (score >= minScore) {
        results.push({
          id,
          content: item.data.content,
          score,
          source: item.data.title || id,
          sourceType: 'knowledge',
          metadata: {
            category: item.data.category,
            keywords: item.data.keywords,
          },
        });
      }
    }
  }

  // Search document chunks
  if (sourceTypes.includes('document')) {
    for (const [id, item] of vectorCache.documents.entries()) {
      // Filter by category if specified
      if (categories && categories.length > 0) {
        if (!categories.includes(item.data.category)) {
          continue;
        }
      }

      const score = cosineSimilarity(queryEmbedding, item.embedding);
      
      if (score >= minScore) {
        results.push({
          id,
          content: item.data.content,
          score,
          source: item.data.documentTitle || id,
          sourceType: 'document',
          metadata: {
            documentId: item.data.documentId,
            chunkIndex: item.data.chunkIndex,
            pageNumber: item.data.pageNumber,
          },
        });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Return top K
  return results.slice(0, topK);
}

/**
 * Refresh the in-memory vector cache from the database
 */
export async function refreshVectorCache(): Promise<void> {
  logger.info('Refreshing vector cache');

  try {
    // Fetch knowledge embeddings
    const knowledgeResponse = await axios.get<{ data: any[] }>(
      `${config.dashboardServiceUrl}/api/internal/knowledge/embeddings`,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 30000,
      }
    );

    vectorCache.knowledge.clear();
    for (const item of knowledgeResponse.data.data || []) {
      if (item.embedding && Array.isArray(item.embedding)) {
        vectorCache.knowledge.set(item.id, {
          embedding: item.embedding,
          data: item,
        });
      }
    }

    // Fetch document chunk embeddings
    const documentsResponse = await axios.get<{ data: any[] }>(
      `${config.dashboardServiceUrl}/api/internal/documents/embeddings`,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 30000,
      }
    );

    vectorCache.documents.clear();
    for (const item of documentsResponse.data.data || []) {
      if (item.embedding && Array.isArray(item.embedding)) {
        vectorCache.documents.set(item.id, {
          embedding: item.embedding,
          data: item,
        });
      }
    }

    vectorCache.lastUpdated = new Date();

    logger.info('Vector cache refreshed', {
      knowledgeItems: vectorCache.knowledge.size,
      documentChunks: vectorCache.documents.size,
    });
  } catch (error: any) {
    logger.error('Failed to refresh vector cache', {
      error: error.message,
    });
  }
}

/**
 * Store embedding for a knowledge base item
 */
export async function storeKnowledgeEmbedding(
  knowledgeId: string,
  embedding: number[]
): Promise<boolean> {
  try {
    await axios.put(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}/embedding`,
      { embedding },
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    logger.debug('Knowledge embedding stored', { knowledgeId });
    return true;
  } catch (error: any) {
    logger.error('Failed to store knowledge embedding', {
      knowledgeId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Store embeddings for document chunks
 */
export async function storeDocumentChunkEmbeddings(
  documentId: string,
  chunks: EmbeddedChunk[]
): Promise<boolean> {
  try {
    await axios.post(
      `${config.dashboardServiceUrl}/api/internal/documents/${documentId}/chunks`,
      { chunks },
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    logger.info('Document chunk embeddings stored', {
      documentId,
      chunkCount: chunks.length,
    });
    return true;
  } catch (error: any) {
    logger.error('Failed to store document chunk embeddings', {
      documentId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Delete embeddings for a knowledge item
 */
export async function deleteKnowledgeEmbedding(knowledgeId: string): Promise<boolean> {
  try {
    await axios.delete(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}/embedding`,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 10000,
      }
    );

    // Remove from cache
    vectorCache.knowledge.delete(knowledgeId);
    
    logger.debug('Knowledge embedding deleted', { knowledgeId });
    return true;
  } catch (error: any) {
    logger.error('Failed to delete knowledge embedding', {
      knowledgeId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Delete embeddings for a document (all chunks)
 */
export async function deleteDocumentEmbeddings(documentId: string): Promise<boolean> {
  try {
    await axios.delete(
      `${config.dashboardServiceUrl}/api/internal/documents/${documentId}/embeddings`,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 10000,
      }
    );

    // Remove from cache
    for (const [key] of vectorCache.documents.entries()) {
      if (key.startsWith(documentId)) {
        vectorCache.documents.delete(key);
      }
    }
    
    logger.debug('Document embeddings deleted', { documentId });
    return true;
  } catch (error: any) {
    logger.error('Failed to delete document embeddings', {
      documentId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Get cache statistics
 */
export function getVectorCacheStats(): {
  knowledgeItems: number;
  documentChunks: number;
  lastUpdated: Date;
  isStale: boolean;
} {
  return {
    knowledgeItems: vectorCache.knowledge.size,
    documentChunks: vectorCache.documents.size,
    lastUpdated: vectorCache.lastUpdated,
    isStale: Date.now() - vectorCache.lastUpdated.getTime() > CACHE_TTL_MS,
  };
}

/**
 * Clear vector cache
 */
export function clearVectorCache(): void {
  vectorCache.knowledge.clear();
  vectorCache.documents.clear();
  vectorCache.lastUpdated = new Date(0);
  logger.info('Vector cache cleared');
}
