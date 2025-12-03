import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/env';
import {
  retrieveContext,
  inferCategories,
} from './rag.service';
import { RAGContext } from '../types/embedding.types';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
}

interface KnowledgeSearchResult {
  data: KnowledgeItem[];
  total: number;
  context: string;
}

// Feature flag for RAG-based search
const USE_RAG_SEARCH = process.env.USE_RAG_SEARCH !== 'false'; // Default: true

/**
 * Search knowledge base for relevant information
 * Uses RAG (semantic search) when enabled, falls back to keyword search
 */
export async function searchKnowledge(query: string, categories?: string[]): Promise<KnowledgeSearchResult> {
  try {
    logger.info('Searching knowledge base', {
      query: query.substring(0, 100),
      categories,
      useRAG: USE_RAG_SEARCH,
    });

    // Try RAG-based semantic search first
    if (USE_RAG_SEARCH) {
      try {
        const ragResult = await searchKnowledgeWithRAG(query, categories);
        if (ragResult.total > 0) {
          return ragResult;
        }
        // If RAG returns no results, fall back to keyword search
        logger.debug('RAG search returned no results, falling back to keyword search');
      } catch (ragError: any) {
        logger.warn('RAG search failed, falling back to keyword search', {
          error: ragError.message,
        });
      }
    }

    // Keyword-based search (fallback or when RAG is disabled)
    return await searchKnowledgeWithKeywords(query, categories);
  } catch (error: any) {
    logger.error('Failed to search knowledge base', {
      error: error.message,
    });

    // Return empty result on error
    return {
      data: [],
      total: 0,
      context: '',
    };
  }
}

/**
 * Search knowledge base using RAG (semantic search with embeddings)
 */
async function searchKnowledgeWithRAG(query: string, categories?: string[]): Promise<KnowledgeSearchResult> {
  const inferredCategories = categories || inferCategories(query);
  
  const ragContext = await retrieveContext(query, {
    topK: 5,
    minScore: 0.65,
    categories: inferredCategories.length > 0 ? inferredCategories : undefined,
    sourceTypes: ['knowledge', 'document'], // Search both knowledge and documents
  });

  if (ragContext.totalResults === 0) {
    return {
      data: [],
      total: 0,
      context: '',
    };
  }

  // Convert RAG results to KnowledgeItem format
  const items: KnowledgeItem[] = ragContext.relevantChunks.map(chunk => ({
    id: chunk.id,
    title: chunk.source,
    content: chunk.content,
    category: chunk.metadata?.category || 'general',
    keywords: chunk.metadata?.keywords || [],
  }));

  logger.info('RAG knowledge search completed', {
    resultsFound: ragContext.totalResults,
    topScore: ragContext.relevantChunks[0]?.score.toFixed(4),
    searchTimeMs: ragContext.searchTimeMs,
  });

  return {
    data: items,
    total: ragContext.totalResults,
    context: ragContext.contextString,
  };
}

/**
 * Search knowledge base using keyword-based API (fallback)
 */
async function searchKnowledgeWithKeywords(query: string, categories?: string[]): Promise<KnowledgeSearchResult> {
  const response = await axios.post<KnowledgeSearchResult>(
    `${config.dashboardServiceUrl}/api/internal/knowledge`,
    {
      query,
      categories,
      limit: 5,
    },
    {
      headers: {
        'x-internal-api-key': config.internalApiKey,
      },
      timeout: 5000,
    }
  );

  logger.info('Keyword knowledge search completed', {
    resultsFound: response.data.total,
  });

  return response.data;
}

/**
 * Get all active knowledge for building context
 */
export async function getAllKnowledge(): Promise<KnowledgeItem[]> {
  try {
    const response = await axios.get<{ data: KnowledgeItem[] }>(
      `${config.dashboardServiceUrl}/api/internal/knowledge`,
      {
        params: { limit: 50 },
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 5000,
      }
    );

    return response.data.data;
  } catch (error: any) {
    logger.error('Failed to get all knowledge', {
      error: error.message,
    });

    return [];
  }
}

/**
 * Get RAG context directly for a query
 * Use this when you need the full RAG context object
 */
export async function getRAGContext(query: string, categories?: string[]): Promise<RAGContext> {
  const inferredCategories = categories || inferCategories(query);
  
  return retrieveContext(query, {
    topK: 5,
    minScore: 0.65,
    categories: inferredCategories.length > 0 ? inferredCategories : undefined,
    sourceTypes: ['knowledge', 'document'],
  });
}
