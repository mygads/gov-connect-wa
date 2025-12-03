import axios from 'axios';
import logger from '../utils/logger';
import { config } from '../config/env';
import { SYSTEM_PROMPT_TEMPLATE, SYSTEM_PROMPT_WITH_KNOWLEDGE } from '../prompts/system-prompt';
import { RAGContext } from '../types/embedding.types';

interface Message {
  id: string;
  message_text: string;
  direction: 'IN' | 'OUT';
  source: string;
  timestamp: string;
}

interface MessageHistoryResponse {
  messages: Message[];
  total: number;
}

/**
 * Build context for LLM including system prompt and conversation history
 * Now accepts full RAGContext to utilize confidence scoring
 */
export async function buildContext(
  wa_user_id: string, 
  currentMessage: string, 
  ragContext?: RAGContext | string
) {
  logger.info('Building context for LLM', { wa_user_id });

  try {
    // Fetch message history from Channel Service
    const messages = await fetchMessageHistory(wa_user_id, config.maxHistoryMessages);
    
    // Format conversation history
    const conversationHistory = formatConversationHistory(messages);
    
    // Build knowledge section with confidence-aware instructions
    const knowledgeSection = buildKnowledgeSection(ragContext);
    
    // Build full prompt
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE
      .replace('{knowledge_context}', knowledgeSection)
      .replace('{history}', conversationHistory)
      .replace('{user_message}', currentMessage);
    
    // Log the formatted history for debugging
    logger.debug('Conversation history formatted', {
      wa_user_id,
      history: conversationHistory.substring(0, 500), // First 500 chars
    });
    
    logger.debug('Context built successfully', {
      wa_user_id,
      messageCount: messages.length,
      promptLength: systemPrompt.length,
      hasKnowledge: !!ragContext,
      knowledgeConfidence: typeof ragContext === 'object' ? ragContext?.confidence?.level : 'N/A',
    });
    
    return {
      systemPrompt,
      messageCount: messages.length,
    };
  } catch (error: any) {
    logger.error('Failed to build context', {
      wa_user_id,
      error: error.message,
    });
    
    // Fallback: return prompt without history
    const fallbackPrompt = SYSTEM_PROMPT_TEMPLATE
      .replace('{knowledge_context}', '')
      .replace('{history}', '(No conversation history available)')
      .replace('{user_message}', currentMessage);
    
    return {
      systemPrompt: fallbackPrompt,
      messageCount: 0,
    };
  }
}

/**
 * Build knowledge section with confidence-aware instructions
 */
function buildKnowledgeSection(ragContext?: RAGContext | string): string {
  if (!ragContext) {
    return '';
  }
  
  // Handle legacy string format (backward compatibility)
  if (typeof ragContext === 'string') {
    if (!ragContext.trim()) return '';
    return `\n\nKNOWLEDGE BASE YANG TERSEDIA:\n${ragContext}`;
  }
  
  // Handle full RAGContext object
  if (ragContext.totalResults === 0 || !ragContext.contextString) {
    return '';
  }
  
  const confidence = ragContext.confidence;
  let confidenceInstruction = '';
  
  if (confidence) {
    switch (confidence.level) {
      case 'high':
        confidenceInstruction = `\n[CONFIDENCE: TINGGI - ${confidence.reason}]
INSTRUKSI: Jawab berdasarkan knowledge di atas. Informasi sangat relevan dengan pertanyaan user.`;
        break;
      case 'medium':
        confidenceInstruction = `\n[CONFIDENCE: SEDANG - ${confidence.reason}]
INSTRUKSI: Gunakan knowledge di atas sebagai sumber utama. Boleh tambahkan info umum jika perlu.`;
        break;
      case 'low':
        confidenceInstruction = `\n[CONFIDENCE: RENDAH - ${confidence.reason}]
INSTRUKSI: Knowledge mungkin hanya sebagian relevan. Gunakan dengan hati-hati, boleh jawab dengan pengetahuan umum.`;
        break;
      default:
        confidenceInstruction = '';
    }
  }
  
  return `\n\nKNOWLEDGE BASE YANG TERSEDIA:
${ragContext.contextString}
${confidenceInstruction}`;
}

/**
 * Build context specifically for knowledge query (second LLM call)
 */
export async function buildKnowledgeQueryContext(
  wa_user_id: string, 
  currentMessage: string, 
  knowledgeContext: string
) {
  logger.info('Building knowledge query context', { wa_user_id });

  try {
    // Fetch message history from Channel Service
    const messages = await fetchMessageHistory(wa_user_id, config.maxHistoryMessages);
    
    // Format conversation history
    const conversationHistory = formatConversationHistory(messages);
    
    // Build full prompt using knowledge-specific template
    const systemPrompt = SYSTEM_PROMPT_WITH_KNOWLEDGE
      .replace('{knowledge_context}', knowledgeContext)
      .replace('{history}', conversationHistory)
      .replace('{user_message}', currentMessage);
    
    logger.debug('Knowledge query context built', {
      wa_user_id,
      messageCount: messages.length,
      knowledgeLength: knowledgeContext.length,
    });
    
    return {
      systemPrompt,
      messageCount: messages.length,
    };
  } catch (error: any) {
    logger.error('Failed to build knowledge query context', {
      wa_user_id,
      error: error.message,
    });
    
    // Fallback
    const fallbackPrompt = SYSTEM_PROMPT_WITH_KNOWLEDGE
      .replace('{knowledge_context}', knowledgeContext)
      .replace('{history}', '(No conversation history available)')
      .replace('{user_message}', currentMessage);
    
    return {
      systemPrompt: fallbackPrompt,
      messageCount: 0,
    };
  }
}

/**
 * Fetch message history from Channel Service internal API
 */
async function fetchMessageHistory(wa_user_id: string, limit: number): Promise<Message[]> {
  try {
    const url = `${config.channelServiceUrl}/internal/messages`;
    const response = await axios.get<MessageHistoryResponse>(url, {
      params: { wa_user_id, limit },
      headers: {
        'x-internal-api-key': config.internalApiKey,
      },
      timeout: 5000,
    });
    
    logger.debug('Fetched message history', {
      wa_user_id,
      count: response.data.messages.length,
    });
    
    return response.data.messages || [];
  } catch (error: any) {
    logger.error('Failed to fetch message history', {
      wa_user_id,
      error: error.message,
    });
    return [];
  }
}

/**
 * Format conversation history for LLM
 * Includes timestamp context and message summarization for long histories
 */
function formatConversationHistory(messages: Message[]): string {
  if (messages.length === 0) {
    return '(Ini adalah percakapan pertama dengan user)';
  }
  
  // If history is very long, summarize older messages
  const MAX_DETAILED_MESSAGES = 10;
  let formatted = '';
  
  if (messages.length > MAX_DETAILED_MESSAGES) {
    // Summarize older messages
    const olderMessages = messages.slice(0, messages.length - MAX_DETAILED_MESSAGES);
    const recentMessages = messages.slice(-MAX_DETAILED_MESSAGES);
    
    // Extract key info from older messages (complaints, addresses, etc.)
    const extractedInfo = extractKeyInfo(olderMessages);
    if (extractedInfo) {
      formatted += `[RINGKASAN PERCAKAPAN SEBELUMNYA]\n${extractedInfo}\n\n[PERCAKAPAN TERBARU]\n`;
    }
    
    // Format recent messages with relative time
    formatted += recentMessages.map(msg => {
      const role = msg.direction === 'IN' ? 'User' : 'Assistant';
      const timeAgo = getRelativeTime(msg.timestamp);
      return `${role} (${timeAgo}): ${msg.message_text}`;
    }).join('\n');
  } else {
    // Format all messages normally
    formatted = messages.map(msg => {
      const role = msg.direction === 'IN' ? 'User' : 'Assistant';
      return `${role}: ${msg.message_text}`;
    }).join('\n');
  }
  
  return formatted;
}

/**
 * Extract key information from older messages for context
 */
function extractKeyInfo(messages: Message[]): string {
  const info: string[] = [];
  
  // Look for addresses mentioned
  const addressPatterns = [
    /(?:di|alamat|lokasi)\s+([a-zA-Z0-9\s,.-]+(?:gang|jalan|jln|jl|rt|rw|no|blok)[a-zA-Z0-9\s,.-]*)/gi,
    /(?:depan|dekat|belakang|samping)\s+([a-zA-Z0-9\s]+)/gi,
  ];
  
  // Look for complaint types
  const complaintKeywords = ['rusak', 'mati', 'sampah', 'banjir', 'tumbang', 'tersumbat'];
  
  // Look for ticket types
  const ticketKeywords = ['surat', 'domisili', 'pengantar', 'izin', 'skck'];
  
  const mentionedAddresses: string[] = [];
  const mentionedProblems: string[] = [];
  const mentionedTickets: string[] = [];
  
  for (const msg of messages) {
    if (msg.direction !== 'IN') continue;
    const text = msg.message_text.toLowerCase();
    
    // Check for complaints
    for (const keyword of complaintKeywords) {
      if (text.includes(keyword) && !mentionedProblems.includes(keyword)) {
        mentionedProblems.push(keyword);
      }
    }
    
    // Check for tickets
    for (const keyword of ticketKeywords) {
      if (text.includes(keyword) && !mentionedTickets.includes(keyword)) {
        mentionedTickets.push(keyword);
      }
    }
    
    // Extract addresses (simplified)
    for (const pattern of addressPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 3 && !mentionedAddresses.includes(match[1].trim())) {
          mentionedAddresses.push(match[1].trim());
        }
      }
    }
  }
  
  if (mentionedProblems.length > 0) {
    info.push(`- Masalah disebutkan: ${mentionedProblems.join(', ')}`);
  }
  if (mentionedTickets.length > 0) {
    info.push(`- Layanan diminta: ${mentionedTickets.join(', ')}`);
  }
  if (mentionedAddresses.length > 0) {
    info.push(`- Alamat disebutkan: ${mentionedAddresses.slice(0, 2).join(', ')}`);
  }
  
  return info.length > 0 ? info.join('\n') : '';
}

/**
 * Get relative time string from timestamp
 */
function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const msgTime = new Date(timestamp);
  const diffMs = now.getTime() - msgTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'kemarin';
  return `${diffDays} hari lalu`;
}

/**
 * Sanitize user input to prevent prompt injection
 * Removes potentially harmful patterns while preserving valid content
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  // Remove excessive whitespace
  let sanitized = input.replace(/\s+/g, ' ').trim();
  
  // Remove control characters (except newlines)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length to prevent context overflow
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000) + '...';
  }
  
  // Remove potential prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|all|above)\s+instructions?/gi,
    /you\s+are\s+(now|a)\s+/gi,
    /system\s*:\s*/gi,
    /\[\s*INST\s*\]/gi,
    /<\/?system>/gi,
    /\{\{[^}]+\}\}/g,  // Template injection
  ];
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  return sanitized.trim();
}
