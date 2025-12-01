import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/env';

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

/**
 * Search knowledge base for relevant information
 */
export async function searchKnowledge(query: string, categories?: string[]): Promise<KnowledgeSearchResult> {
  try {
    logger.info('Searching knowledge base', {
      query: query.substring(0, 100),
      categories,
    });

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

    logger.info('Knowledge search completed', {
      resultsFound: response.data.total,
    });

    return response.data;
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
 * Build knowledge context string for AI prompt
 */
export function buildKnowledgeContext(items: KnowledgeItem[]): string {
  if (items.length === 0) {
    return '';
  }

  const contextParts = items.map(item => 
    `[${item.category.toUpperCase()}] ${item.title}\n${item.content}`
  );

  return contextParts.join('\n\n---\n\n');
}
