/**
 * Web Chat Routes
 * HTTP endpoint untuk live chat widget di landing page
 * Memproses pesan secara synchronous dan mengembalikan respons langsung
 * 
 * IMPORTANT: Menggunakan unified-message-processor.service.ts untuk konsistensi
 * dengan WhatsApp flow. Semua logic NLU, intent detection, RAG, dll dipusatkan
 * di unified processor.
 */

import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import { processUnifiedMessage } from '../services/unified-message-processor.service';

const router = Router();

// In-memory store untuk web chat sessions
// Dalam production, gunakan Redis atau database
const webChatSessions = new Map<string, {
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  createdAt: Date;
  lastActivity: Date;
}>();

// Cleanup old sessions (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, session] of webChatSessions.entries()) {
    if (now - session.lastActivity.getTime() > maxAge) {
      webChatSessions.delete(sessionId);
      logger.info('Cleaned up old web chat session', { sessionId });
    }
  }
}, 60 * 60 * 1000); // Run every hour

/**
 * Process web chat message
 * POST /api/webchat
 * 
 * Menggunakan unified processor untuk konsistensi dengan WhatsApp
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { session_id, message, channel } = req.body;
    
    if (!session_id || !message) {
      res.status(400).json({
        success: false,
        error: 'session_id dan message diperlukan',
      });
      return;
    }
    
    // Validate session ID format
    if (!session_id.startsWith('web_')) {
      res.status(400).json({
        success: false,
        error: 'Format session_id tidak valid',
      });
      return;
    }
    
    logger.info('📱 Web chat message received', {
      session_id,
      messageLength: message.length,
      channel: channel || 'webchat',
    });

    
    // Get or create session
    let session = webChatSessions.get(session_id);
    if (!session) {
      session = {
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      webChatSessions.set(session_id, session);
    }
    
    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    session.lastActivity = new Date();
    
    // Process message using UNIFIED processor (same as WhatsApp)
    // This ensures consistent NLU, intent detection, RAG, prompts, etc.
    const result = await processUnifiedMessage({
      userId: session_id,
      message: message,
      channel: 'webchat',
      conversationHistory: session.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });
    
    // Add assistant response to session
    session.messages.push({
      role: 'assistant',
      content: result.response,
      timestamp: new Date(),
    });
    
    const processingTime = Date.now() - startTime;
    
    logger.info('✅ Web chat response sent', {
      session_id,
      intent: result.intent,
      responseLength: result.response.length,
      processingTimeMs: processingTime,
    });
    
    res.json({
      success: true,
      response: result.response,
      guidanceText: result.guidanceText,
      intent: result.intent,
      metadata: {
        session_id,
        processingTimeMs: result.metadata.processingTimeMs,
        messageCount: session.messages.length,
        model: result.metadata.model,
        hasKnowledge: result.metadata.hasKnowledge,
        knowledgeConfidence: result.metadata.knowledgeConfidence,
        sentiment: result.metadata.sentiment,
      },
    });
    
  } catch (error: any) {
    logger.error('❌ Web chat error', {
      error: error.message,
      stack: error.stack,
    });
    
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan saat memproses pesan',
      response: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi kami via WhatsApp.',
    });
  }
});

/**
 * Get session history
 * GET /api/webchat/:session_id
 */
router.get('/:session_id', (req: Request, res: Response) => {
  const { session_id } = req.params;
  
  const session = webChatSessions.get(session_id);
  
  if (!session) {
    res.status(404).json({
      success: false,
      error: 'Session tidak ditemukan',
    });
    return;
  }
  
  res.json({
    success: true,
    session: {
      session_id,
      messages: session.messages,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    },
  });
});

/**
 * Clear session
 * DELETE /api/webchat/:session_id
 */
router.delete('/:session_id', (req: Request, res: Response) => {
  const { session_id } = req.params;
  
  const deleted = webChatSessions.delete(session_id);
  
  res.json({
    success: true,
    deleted,
  });
});

/**
 * Get session stats
 * GET /api/webchat/stats
 */
router.get('/stats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    activeSessions: webChatSessions.size,
  });
});

export default router;
