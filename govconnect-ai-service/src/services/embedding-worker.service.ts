/**
 * Embedding Worker Service for GovConnect AI
 * 
 * Handles background embedding generation using job queue
 * This prevents blocking the UI when regenerating embeddings
 * 
 * Features:
 * - Job queue for embedding tasks
 * - Priority-based processing
 * - Retry logic for failed jobs
 * - Progress tracking
 */

import logger from '../utils/logger';
import { config } from '../config/env';
import { generateEmbedding, generateBatchEmbeddings } from './embedding.service';
import axios from 'axios';

/**
 * Embedding job types
 */
export type EmbeddingJobType = 'knowledge' | 'document' | 'document_chunk' | 'batch_knowledge' | 'batch_document';

/**
 * Embedding job data
 */
export interface EmbeddingJob {
  id: string;
  type: EmbeddingJobType;
  targetId: string;         // ID of knowledge/document to embed
  priority?: number;        // Higher = processed first
  retryCount?: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  result?: {
    embeddingDimensions?: number;
    processingTimeMs?: number;
  };
}

/**
 * In-memory job queue (for lightweight deployment without Redis)
 * For production with Redis, use BullMQ instead
 */
class EmbeddingJobQueue {
  private queue: EmbeddingJob[] = [];
  private processing = false;
  private maxConcurrent = 2;
  private activeJobs = 0;
  private jobCallbacks = new Map<string, (result: EmbeddingJob) => void>();

  /**
   * Add a job to the queue
   */
  addJob(job: Omit<EmbeddingJob, 'id' | 'createdAt' | 'status'>): string {
    const fullJob: EmbeddingJob = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: 'pending',
      retryCount: job.retryCount || 0,
      priority: job.priority || 0,
    };

    this.queue.push(fullJob);
    // Sort by priority (higher first) then by creation time
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0);
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    logger.info('Embedding job added to queue', {
      jobId: fullJob.id,
      type: fullJob.type,
      targetId: fullJob.targetId,
      queueLength: this.queue.length,
    });

    // Start processing if not already running
    this.processQueue();

    return fullJob.id;
  }

  /**
   * Process jobs from the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing && this.activeJobs >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const job = this.queue.find(j => j.status === 'pending');
      if (!job) break;

      job.status = 'processing';
      this.activeJobs++;

      // Process async
      this.processJob(job)
        .then(() => {
          job.status = 'completed';
          logger.info('Embedding job completed', {
            jobId: job.id,
            type: job.type,
            targetId: job.targetId,
          });
        })
        .catch((error) => {
          job.status = 'failed';
          job.error = error.message;
          logger.error('Embedding job failed', {
            jobId: job.id,
            type: job.type,
            targetId: job.targetId,
            error: error.message,
          });

          // Retry logic
          if ((job.retryCount || 0) < 3) {
            this.addJob({
              type: job.type,
              targetId: job.targetId,
              priority: (job.priority || 0) - 1, // Lower priority for retries
              retryCount: (job.retryCount || 0) + 1,
            });
          }
        })
        .finally(() => {
          this.activeJobs--;
          // Remove completed/failed jobs from queue after 1 hour
          setTimeout(() => {
            const idx = this.queue.findIndex(j => j.id === job.id);
            if (idx !== -1) this.queue.splice(idx, 1);
          }, 60 * 60 * 1000);

          // Notify callback if exists
          const callback = this.jobCallbacks.get(job.id);
          if (callback) {
            callback(job);
            this.jobCallbacks.delete(job.id);
          }

          // Continue processing
          this.processQueue();
        });
    }

    if (this.activeJobs === 0) {
      this.processing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: EmbeddingJob): Promise<void> {
    const startTime = Date.now();

    switch (job.type) {
      case 'knowledge':
        await this.processKnowledgeEmbedding(job.targetId);
        break;
      case 'document':
        await this.processDocumentEmbedding(job.targetId);
        break;
      case 'document_chunk':
        await this.processChunkEmbedding(job.targetId);
        break;
      case 'batch_knowledge':
        await this.processBatchKnowledgeEmbedding();
        break;
      case 'batch_document':
        await this.processBatchDocumentEmbedding(job.targetId);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    job.result = {
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Generate embedding for a knowledge base item
   */
  private async processKnowledgeEmbedding(knowledgeId: string): Promise<void> {
    // Fetch knowledge content
    const response = await axios.get(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}`,
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 10000,
      }
    );

    const knowledge = response.data;
    if (!knowledge) {
      throw new Error(`Knowledge not found: ${knowledgeId}`);
    }

    // Generate embedding
    const embedding = await generateEmbedding(knowledge.content, {
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    });

    // Save embedding back to dashboard
    await axios.put(
      `${config.dashboardServiceUrl}/api/internal/knowledge/${knowledgeId}/embedding`,
      {
        embedding: embedding.values,
        model: embedding.model,
        dimensions: embedding.dimensions,
      },
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 10000,
      }
    );

    logger.info('Knowledge embedding generated', {
      knowledgeId,
      dimensions: embedding.dimensions,
    });
  }

  /**
   * Generate embeddings for all chunks of a document
   */
  private async processDocumentEmbedding(documentId: string): Promise<void> {
    // Fetch document chunks
    const response = await axios.get(
      `${config.dashboardServiceUrl}/api/internal/documents/${documentId}/chunks`,
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 30000,
      }
    );

    const chunks = response.data.chunks || [];
    if (chunks.length === 0) {
      logger.warn('No chunks found for document', { documentId });
      return;
    }

    // Generate embeddings in batch
    const texts = chunks.map((c: any) => c.content);
    const batchResult = await generateBatchEmbeddings(texts, {
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    });

    // Save embeddings back to dashboard
    const embeddings = chunks.map((chunk: any, idx: number) => ({
      chunkId: chunk.id,
      embedding: batchResult.embeddings[idx].values,
      model: batchResult.embeddings[idx].model,
      dimensions: batchResult.embeddings[idx].dimensions,
    }));

    await axios.put(
      `${config.dashboardServiceUrl}/api/internal/documents/${documentId}/embeddings`,
      { embeddings },
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 30000,
      }
    );

    logger.info('Document embeddings generated', {
      documentId,
      chunkCount: chunks.length,
    });
  }

  /**
   * Generate embedding for a single chunk
   */
  private async processChunkEmbedding(chunkId: string): Promise<void> {
    // Fetch chunk content
    const response = await axios.get(
      `${config.dashboardServiceUrl}/api/internal/chunks/${chunkId}`,
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 10000,
      }
    );

    const chunk = response.data;
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }

    // Generate embedding
    const embedding = await generateEmbedding(chunk.content, {
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    });

    // Save embedding
    await axios.put(
      `${config.dashboardServiceUrl}/api/internal/chunks/${chunkId}/embedding`,
      {
        embedding: embedding.values,
        model: embedding.model,
        dimensions: embedding.dimensions,
      },
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 10000,
      }
    );

    logger.info('Chunk embedding generated', {
      chunkId,
      dimensions: embedding.dimensions,
    });
  }

  /**
   * Regenerate all knowledge base embeddings
   */
  private async processBatchKnowledgeEmbedding(): Promise<void> {
    // Fetch all knowledge items without embeddings or with stale embeddings
    const response = await axios.get(
      `${config.dashboardServiceUrl}/api/internal/knowledge/needs-embedding`,
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 30000,
      }
    );

    const items = response.data.items || [];
    if (items.length === 0) {
      logger.info('No knowledge items need embedding regeneration');
      return;
    }

    logger.info('Starting batch knowledge embedding', {
      itemCount: items.length,
    });

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const texts = batch.map((item: any) => item.content);

      const batchResult = await generateBatchEmbeddings(texts, {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      });

      // Save embeddings
      const embeddings = batch.map((item: any, idx: number) => ({
        id: item.id,
        embedding: batchResult.embeddings[idx].values,
        model: batchResult.embeddings[idx].model,
      }));

      await axios.put(
        `${config.dashboardServiceUrl}/api/internal/knowledge/batch-embeddings`,
        { embeddings },
        {
          headers: { 'x-internal-api-key': config.internalApiKey },
          timeout: 30000,
        }
      );

      logger.info('Batch embedding progress', {
        processed: i + batch.length,
        total: items.length,
      });
    }

    logger.info('Batch knowledge embedding completed', {
      totalProcessed: items.length,
    });
  }

  /**
   * Regenerate all document chunk embeddings for a document
   */
  private async processBatchDocumentEmbedding(documentId: string): Promise<void> {
    await this.processDocumentEmbedding(documentId);
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): EmbeddingJob | null {
    return this.queue.find(j => j.id === jobId) || null;
  }

  /**
   * Get queue stats
   */
  getQueueStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    return {
      pending: this.queue.filter(j => j.status === 'pending').length,
      processing: this.queue.filter(j => j.status === 'processing').length,
      completed: this.queue.filter(j => j.status === 'completed').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
      total: this.queue.length,
    };
  }

  /**
   * Wait for a job to complete
   */
  async waitForJob(jobId: string, timeoutMs = 60000): Promise<EmbeddingJob> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.jobCallbacks.delete(jobId);
        reject(new Error(`Job ${jobId} timed out`));
      }, timeoutMs);

      this.jobCallbacks.set(jobId, (result) => {
        clearTimeout(timeout);
        if (result.status === 'completed') {
          resolve(result);
        } else {
          reject(new Error(result.error || 'Job failed'));
        }
      });

      // Check if job is already completed
      const job = this.getJobStatus(jobId);
      if (job && (job.status === 'completed' || job.status === 'failed')) {
        clearTimeout(timeout);
        this.jobCallbacks.delete(jobId);
        if (job.status === 'completed') {
          resolve(job);
        } else {
          reject(new Error(job.error || 'Job failed'));
        }
      }
    });
  }

  /**
   * Clear all jobs (for testing)
   */
  clearQueue(): void {
    this.queue = [];
    this.processing = false;
    this.activeJobs = 0;
    logger.info('Embedding job queue cleared');
  }
}

// Singleton instance
export const embeddingJobQueue = new EmbeddingJobQueue();

// ==================== PUBLIC API ====================

/**
 * Queue an embedding job for a knowledge item
 */
export function queueKnowledgeEmbedding(knowledgeId: string, priority = 0): string {
  return embeddingJobQueue.addJob({
    type: 'knowledge',
    targetId: knowledgeId,
    priority,
  });
}

/**
 * Queue an embedding job for a document
 */
export function queueDocumentEmbedding(documentId: string, priority = 0): string {
  return embeddingJobQueue.addJob({
    type: 'document',
    targetId: documentId,
    priority,
  });
}

/**
 * Queue a batch regeneration of all knowledge embeddings
 */
export function queueBatchKnowledgeEmbedding(priority = -1): string {
  return embeddingJobQueue.addJob({
    type: 'batch_knowledge',
    targetId: 'all',
    priority, // Lower priority than individual jobs
  });
}

/**
 * Get job status by ID
 */
export function getEmbeddingJobStatus(jobId: string): EmbeddingJob | null {
  return embeddingJobQueue.getJobStatus(jobId);
}

/**
 * Get queue statistics
 */
export function getEmbeddingQueueStats() {
  return embeddingJobQueue.getQueueStats();
}

/**
 * Wait for a job to complete
 */
export async function waitForEmbeddingJob(jobId: string, timeoutMs = 60000): Promise<EmbeddingJob> {
  return embeddingJobQueue.waitForJob(jobId, timeoutMs);
}
