/**
 * Knowledge Quality Service for GovConnect AI
 * 
 * Tracks and manages quality scores for knowledge base items
 * to improve RAG retrieval accuracy over time.
 * 
 * Features:
 * - Usage tracking (retrieval count, click count)
 * - Quality score calculation
 * - Feedback integration
 * - Score-based result boosting
 */

import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/env';
import { VectorSearchResult } from '../types/embedding.types';

/**
 * Quality metrics for a knowledge item
 */
interface KnowledgeQualityMetrics {
  id: string;
  qualityScore: number;
  usageCount: number;
  retrievalCount: number;
  clickCount: number;
  lastRetrieved?: Date;
  feedbackScore?: number;
}

/**
 * In-memory cache for quality scores (refreshed periodically)
 */
const qualityScoreCache = new Map<string, KnowledgeQualityMetrics>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let lastCacheRefresh = 0;

/**
 * Record that a knowledge item was retrieved (shown in search results)
 */
export async function recordRetrieval(knowledgeId: string): Promise<void> {
  try {
    await axios.post(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}/metrics`,
      { action: 'retrieval' },
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 2000, // Quick timeout to not block main flow
      }
    );
  } catch (error: any) {
    // Don't fail the main flow for metrics
    logger.debug('Failed to record retrieval metric', {
      knowledgeId,
      error: error.message,
    });
  }
}

/**
 * Record that a knowledge item was used (clicked/selected)
 */
export async function recordUsage(knowledgeId: string): Promise<void> {
  try {
    await axios.post(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}/metrics`,
      { action: 'usage' },
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 2000,
      }
    );
  } catch (error: any) {
    logger.debug('Failed to record usage metric', {
      knowledgeId,
      error: error.message,
    });
  }
}

/**
 * Record user feedback for a knowledge response
 * 
 * @param knowledgeId - The knowledge item ID
 * @param feedback - Feedback value (-1 = negative, 0 = neutral, 1 = positive)
 */
export async function recordFeedback(
  knowledgeId: string,
  feedback: -1 | 0 | 1
): Promise<void> {
  try {
    await axios.post(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}/feedback`,
      { feedback },
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 2000,
      }
    );

    logger.info('Recorded feedback for knowledge', {
      knowledgeId,
      feedback,
    });
  } catch (error: any) {
    logger.warn('Failed to record feedback', {
      knowledgeId,
      error: error.message,
    });
  }
}

/**
 * Get quality metrics for a knowledge item
 */
export async function getQualityMetrics(
  knowledgeId: string
): Promise<KnowledgeQualityMetrics | null> {
  // Check cache first
  const cached = qualityScoreCache.get(knowledgeId);
  if (cached && Date.now() - lastCacheRefresh < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const response = await axios.get<KnowledgeQualityMetrics>(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}/metrics`,
      {
        headers: {
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 3000,
      }
    );

    const metrics = response.data;
    qualityScoreCache.set(knowledgeId, metrics);
    return metrics;
  } catch (error: any) {
    logger.debug('Failed to fetch quality metrics', {
      knowledgeId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Calculate quality score boost for search result re-ranking
 * 
 * @param knowledgeId - The knowledge item ID
 * @returns Score boost (0.0 - 0.2)
 */
export async function getQualityBoost(knowledgeId: string): Promise<number> {
  const metrics = await getQualityMetrics(knowledgeId);
  
  if (!metrics) {
    return 0;
  }

  // Base boost from quality score (max 0.1)
  const qualityBoost = (metrics.qualityScore - 0.5) * 0.2;

  // Boost from click-through rate (max 0.05)
  const ctr = metrics.retrievalCount > 0 
    ? metrics.clickCount / metrics.retrievalCount 
    : 0;
  const ctrBoost = Math.min(ctr * 0.1, 0.05);

  // Boost from feedback (max 0.05)
  const feedbackBoost = metrics.feedbackScore 
    ? metrics.feedbackScore * 0.05 
    : 0;

  const totalBoost = Math.max(0, Math.min(0.2, qualityBoost + ctrBoost + feedbackBoost));

  return totalBoost;
}

/**
 * Apply quality scoring to search results
 * This modifies the scores in place and re-sorts
 */
export async function applyQualityScoring(
  results: VectorSearchResult[]
): Promise<VectorSearchResult[]> {
  // Only apply to knowledge items, not document chunks
  const knowledgeResults = results.filter(r => r.sourceType === 'knowledge');
  
  if (knowledgeResults.length === 0) {
    return results;
  }

  // Get quality boosts in parallel
  const boosts = await Promise.all(
    knowledgeResults.map(async r => ({
      id: r.id,
      boost: await getQualityBoost(r.id),
    }))
  );

  // Create boost map
  const boostMap = new Map(boosts.map(b => [b.id, b.boost]));

  // Apply boosts
  const scoredResults = results.map(r => {
    if (r.sourceType === 'knowledge') {
      const boost = boostMap.get(r.id) || 0;
      return {
        ...r,
        score: Math.min(1.0, r.score + boost),
      };
    }
    return r;
  });

  // Re-sort by score
  return scoredResults.sort((a, b) => b.score - a.score);
}

/**
 * Batch record retrievals for multiple knowledge items
 * Used when multiple items are returned in search results
 */
export async function recordBatchRetrievals(knowledgeIds: string[]): Promise<void> {
  // Fire and forget - don't wait for completion
  for (const id of knowledgeIds) {
    recordRetrieval(id).catch(() => {
      // Silently ignore errors
    });
  }
}

/**
 * Calculate dynamic quality score based on metrics
 * This formula can be tuned based on observed patterns
 */
export function calculateQualityScore(metrics: {
  usageCount: number;
  retrievalCount: number;
  clickCount: number;
  feedbackScore?: number;
  daysSinceUpdate: number;
}): number {
  const { usageCount, retrievalCount, clickCount, feedbackScore, daysSinceUpdate } = metrics;

  // Base score starts at 0.5
  let score = 0.5;

  // Usage frequency boost (max +0.2)
  // Log scale to prevent runaway scores
  const usageBoost = Math.min(0.2, Math.log10(usageCount + 1) * 0.1);
  score += usageBoost;

  // Click-through rate boost (max +0.15)
  if (retrievalCount > 10) {
    const ctr = clickCount / retrievalCount;
    score += Math.min(0.15, ctr * 0.3);
  }

  // Feedback boost/penalty (±0.15)
  if (feedbackScore !== undefined) {
    score += feedbackScore * 0.15;
  }

  // Freshness penalty (up to -0.1 for old content)
  // Items not updated in 90+ days get penalty
  if (daysSinceUpdate > 90) {
    const agePenalty = Math.min(0.1, (daysSinceUpdate - 90) / 365 * 0.1);
    score -= agePenalty;
  }

  // Clamp to [0.1, 1.0]
  return Math.max(0.1, Math.min(1.0, score));
}

/**
 * Clear quality score cache (for testing or refresh)
 */
export function clearQualityCache(): void {
  qualityScoreCache.clear();
  lastCacheRefresh = 0;
  logger.info('Quality score cache cleared');
}
