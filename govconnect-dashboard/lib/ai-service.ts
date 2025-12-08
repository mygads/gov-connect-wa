/**
 * AI Service Client for Dashboard
 * 
 * Handles communication with AI Service for vector operations
 * Called when admin creates/updates/deletes knowledge or documents
 * 
 * Uses single endpoint via Traefik: API_BASE_URL/ai/*
 */

import { ai } from './api-client';

interface KnowledgeVectorPayload {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
  qualityScore?: number;
}

interface DocumentChunk {
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  sectionTitle?: string;
}

interface DocumentVectorPayload {
  documentId: string;
  documentTitle?: string;
  category?: string;
  chunks: DocumentChunk[];
}

/**
 * Add knowledge vector to AI Service
 * Called when admin creates new knowledge
 */
export async function addKnowledgeVector(payload: KnowledgeVectorPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ai.addKnowledge(payload);

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to add knowledge vector:', error);
      return { success: false, error: error.error || 'Failed to add vector' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error calling AI Service:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update knowledge vector in AI Service
 * Called when admin updates knowledge (re-embeds)
 */
export async function updateKnowledgeVector(id: string, payload: Omit<KnowledgeVectorPayload, 'id'>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ai.updateKnowledge(id, payload);

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to update knowledge vector:', error);
      return { success: false, error: error.error || 'Failed to update vector' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error calling AI Service:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Delete knowledge vector from AI Service
 * Called when admin deletes knowledge
 */
export async function deleteKnowledgeVector(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ai.deleteKnowledge(id);

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to delete knowledge vector:', error);
      return { success: false, error: error.error || 'Failed to delete vector' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error calling AI Service:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Add document vectors to AI Service
 * Called when admin uploads a document
 */
export async function addDocumentVectors(payload: DocumentVectorPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ai.addDocument(payload);

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to add document vectors:', error);
      return { success: false, error: error.error || 'Failed to add vectors' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error calling AI Service:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update document vectors in AI Service
 * Called when admin updates a document (re-embeds all chunks)
 */
export async function updateDocumentVectors(documentId: string, payload: Omit<DocumentVectorPayload, 'documentId'>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ai.updateDocument(documentId, payload);

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to update document vectors:', error);
      return { success: false, error: error.error || 'Failed to update vectors' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error calling AI Service:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Delete document vectors from AI Service
 * Called when admin deletes a document
 */
export async function deleteDocumentVectors(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ai.deleteDocument(documentId);

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to delete document vectors:', error);
      return { success: false, error: error.error || 'Failed to delete vectors' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error calling AI Service:', error.message);
    return { success: false, error: error.message };
  }
}
