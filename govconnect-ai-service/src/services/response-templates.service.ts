/**
 * Response Templates Service
 * 
 * Pre-defined response templates for common scenarios to reduce LLM calls.
 * 
 * Benefits:
 * - Faster response time
 * - Lower API costs
 * - Consistent responses
 * - Works offline if LLM is down
 * 
 * REFACTORED: Now uses centralized patterns and templates from constants/
 */

import {
  GREETING_PATTERNS,
  CONFIRMATION_PATTERNS,
  THANKS_PATTERNS,
  KNOWLEDGE_QUERY_PATTERNS,
  matchesAnyPattern,
} from '../constants/intent-patterns';

import {
  GREETING_RESPONSES,
  THANKS_RESPONSES,
  CONFIRMATION_RESPONSES,
  JAM_BUKA_RESPONSE,
  LOKASI_RESPONSE,
  LAYANAN_RESPONSE,
  SYARAT_UMUM_RESPONSE,
  BIAYA_RESPONSE,
  getRandomItem,
} from '../constants/response-templates';

// ==================== TYPES ====================

export interface TemplateMatch {
  matched: boolean;
  response?: string;
  intent?: string;
  confidence: number;
}

// ==================== ADDITIONAL PATTERNS (Knowledge-specific) ====================

const JAM_BUKA_PATTERNS = [
  /jam\s*(buka|operasional|kerja|pelayanan)/i,
  /buka\s*jam\s*berapa/i,
  /kapan\s*(buka|tutup)/i,
  /hari\s*apa\s*(buka|libur)/i,
];

const LOKASI_PATTERNS = [
  /dimana\s*(kantor|lokasi|alamat)/i,
  /alamat\s*(kantor|kelurahan)/i,
  /lokasi\s*(kantor|kelurahan)/i,
  /kantor\s*(dimana|di\s*mana)/i,
];

const LAYANAN_PATTERNS = [
  /layanan\s*(apa\s*saja|yang\s*tersedia)/i,
  /apa\s*saja\s*(layanan|surat)/i,
  /jenis\s*(layanan|surat)/i,
  /bisa\s*(urus|buat)\s*apa/i,
];

const SYARAT_PATTERNS = [
  /syarat\s*(umum|pengurusan)/i,
  /apa\s*saja\s*syarat/i,
  /dokumen\s*apa\s*(saja|yang)/i,
  /perlu\s*bawa\s*apa/i,
];

const BIAYA_PATTERNS = [
  /biaya|tarif|harga|bayar/i,
  /berapa\s*(biaya|harga)/i,
  /gratis\s*(atau|apa)/i,
  /ada\s*biaya/i,
];

// ==================== MAIN FUNCTION ====================

/**
 * Try to match message with templates
 * Returns response if matched, null otherwise
 * Uses centralized patterns from constants/intent-patterns.ts
 */
export function matchTemplate(message: string): TemplateMatch {
  const cleanMessage = message.trim();

  // Check greetings (using centralized patterns)
  if (matchesAnyPattern(cleanMessage, GREETING_PATTERNS)) {
    return {
      matched: true,
      response: getRandomItem(GREETING_RESPONSES),
      intent: 'GREETING',
      confidence: 0.95,
    };
  }

  // Check thanks (using centralized patterns)
  if (matchesAnyPattern(cleanMessage, THANKS_PATTERNS)) {
    return {
      matched: true,
      response: getRandomItem(THANKS_RESPONSES),
      intent: 'THANKS',
      confidence: 0.95,
    };
  }

  // Check confirmations (short messages only, using centralized patterns)
  if (cleanMessage.length < 15 && matchesAnyPattern(cleanMessage, CONFIRMATION_PATTERNS)) {
    return {
      matched: true,
      response: getRandomItem(CONFIRMATION_RESPONSES),
      intent: 'CONFIRMATION',
      confidence: 0.9,
    };
  }

  // Check jam buka
  if (matchesAnyPattern(cleanMessage, JAM_BUKA_PATTERNS)) {
    return {
      matched: true,
      response: JAM_BUKA_RESPONSE,
      intent: 'KNOWLEDGE_QUERY',
      confidence: 0.9,
    };
  }

  // Check lokasi
  if (matchesAnyPattern(cleanMessage, LOKASI_PATTERNS)) {
    return {
      matched: true,
      response: LOKASI_RESPONSE,
      intent: 'KNOWLEDGE_QUERY',
      confidence: 0.9,
    };
  }

  // Check layanan
  if (matchesAnyPattern(cleanMessage, LAYANAN_PATTERNS)) {
    return {
      matched: true,
      response: LAYANAN_RESPONSE,
      intent: 'KNOWLEDGE_QUERY',
      confidence: 0.9,
    };
  }

  // Check syarat
  if (matchesAnyPattern(cleanMessage, SYARAT_PATTERNS)) {
    return {
      matched: true,
      response: SYARAT_UMUM_RESPONSE,
      intent: 'KNOWLEDGE_QUERY',
      confidence: 0.85,
    };
  }

  // Check biaya
  if (matchesAnyPattern(cleanMessage, BIAYA_PATTERNS)) {
    return {
      matched: true,
      response: BIAYA_RESPONSE,
      intent: 'KNOWLEDGE_QUERY',
      confidence: 0.9,
    };
  }

  return { matched: false, confidence: 0 };
}

// ==================== EXPORTS ====================

export default {
  matchTemplate,
};
