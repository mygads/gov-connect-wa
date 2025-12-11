/**
 * Fast Intent Classifier Service
 * 
 * Klasifikasi intent cepat menggunakan pattern matching sebelum LLM.
 * Mengurangi latency dan cost untuk pesan-pesan yang jelas intentnya.
 * 
 * Flow:
 * 1. Fast classify dengan regex patterns
 * 2. Jika confidence tinggi (>0.8) → skip LLM untuk intent detection
 * 3. Jika confidence rendah → fallback ke LLM
 */

import logger from '../utils/logger';

export interface FastClassifyResult {
  intent: string;
  confidence: number;
  extractedFields: Record<string, any>;
  skipLLM: boolean;
  reason: string;
}

// ==================== INTENT PATTERNS ====================

const GREETING_PATTERNS = [
  /^(halo|hai|hi|hello|hey)[\s!.,]*$/i,
  /^selamat\s+(pagi|siang|sore|malam)[\s!.,]*$/i,
  /^assalamualaikum[\s!.,]*$/i,
  /^permisi[\s!.,]*$/i,
  /^(p|pagi|siang|sore|malam)[\s!.,]*$/i,
];

const CONFIRMATION_PATTERNS = [
  /^(ya|iya|yap|yup|yoi|oke|ok|okay|okey|baik|siap|betul|benar|bener)[\s!.,]*$/i,
  /^(lanjut|lanjutkan|proses|setuju|boleh|bisa|gas|gaskan)[\s!.,]*$/i,
  /^(sudah|udah|cukup|itu\s+saja|itu\s+aja|segitu\s+aja)[\s!.,]*$/i,
];

const REJECTION_PATTERNS = [
  /^(tidak|nggak|gak|ga|enggak|engga|no|nope|jangan|batal|cancel)[\s!.,]*$/i,
  /^(belum|nanti\s+dulu|nanti\s+aja|skip)[\s!.,]*$/i,
];

const THANKS_PATTERNS = [
  /^(terima\s*kasih|makasih|thanks|thank\s*you|thx|tq)[\s!.,]*$/i,
  /^(ok\s+)?makasih[\s!.,]*$/i,
];

const CREATE_COMPLAINT_PATTERNS = [
  // Direct complaint keywords - must have explicit intent to report
  /\b(mau\s+)?lapor(kan)?\s+/i,
  /\b(ada\s+)?(masalah|keluhan|aduan|komplain)\s+(di|dengan|tentang)/i,
  
  // Specific complaint types - must have action/state words
  /\b(jalan|aspal)\s+(rusak|berlubang|retak|hancur|jelek)\b/i,
  /\b(lampu|penerangan)\s+(jalan\s+)?(mati|padam|rusak|tidak\s+menyala)\b/i,
  /\b(sampah)\s+(menumpuk|berserakan|banyak|tidak\s+diangkut)\b/i,
  /\b(saluran|got|selokan|drainase)\s+(tersumbat|mampet|macet|buntu)\b/i,
  /\b(pohon)\s+(tumbang|roboh|patah|miring)\b/i,
  // Banjir - only match if it's clearly a report (with location or "ada")
  /\b(ada\s+)?banjir\s+(di|besar|parah)/i,
  /\b(mau\s+lapor\s+)?banjir\b/i,
  /\b(fasilitas|taman|pagar)\s+(rusak|jelek)\b/i,
];

const CREATE_RESERVATION_PATTERNS = [
  // Direct reservation keywords
  /\b(mau\s+)?(reservasi|booking|daftar|antri)\b/i,
  /\b(mau\s+)?(buat|bikin|urus|minta)\s+(surat|dokumen)\b/i,
  /\b(perlu|butuh)\s+(surat|dokumen)\b/i,
  
  // Specific document types
  /\b(surat\s+)?(keterangan\s+)?(domisili|skd)\b/i,
  /\b(surat\s+)?(keterangan\s+)?(tidak\s+mampu|sktm)\b/i,
  /\b(surat\s+)?(keterangan\s+)?(usaha|sku)\b/i,
  /\b(surat\s+)?(pengantar\s+)?(ktp|spktp)\b/i,
  /\b(surat\s+)?(pengantar\s+)?(kk|kartu\s+keluarga|spkk)\b/i,
  /\b(surat\s+)?(pengantar\s+)?(skck|spskck)\b/i,
  /\b(surat\s+)?(pengantar\s+)?(akta|spakta)\b/i,
];

const CHECK_STATUS_PATTERNS = [
  /\b(cek|check|lihat|gimana|bagaimana)\s+(status|perkembangan|progress)\b/i,
  /\b(status)\s+(laporan|reservasi|tiket|pengaduan)\b/i,
  /\bLAP-\d{8}-\d{3}\b/i,
  /\bRSV-\d{8}-\d{3}\b/i,
  /\b(sudah|udah)\s+(sampai\s+mana|diproses|ditangani)\b/i,
];

const CANCEL_PATTERNS = [
  /\b(batalkan|cancel|batal)\s+(laporan|reservasi|tiket)\b/i,
  /\b(mau|ingin)\s+(batalkan|cancel|batal)\b/i,
  /\b(hapus)\s+(laporan|reservasi)\b/i,
];

const HISTORY_PATTERNS = [
  /\b(riwayat|history|daftar)\s+(laporan|reservasi|tiket|saya)\b/i,
  /\b(laporan|reservasi)\s+(saya|ku|gue|gw)\b/i,
  /\b(lihat|cek)\s+(semua\s+)?(laporan|reservasi)\b/i,
];

const KNOWLEDGE_QUERY_PATTERNS = [
  // Time/schedule questions
  /\b(jam|waktu)\s+(buka|tutup|operasional|kerja|pelayanan)\b/i,
  /\b(buka|tutup)\s+(jam\s+)?berapa\b/i,
  /\b(hari\s+)?(libur|kerja)\b/i,
  
  // Location questions
  /\b(dimana|di\s+mana|lokasi|alamat)\s+(kantor|kelurahan)\b/i,
  /\b(kantor|kelurahan)\s+(dimana|di\s+mana)\b/i,
  
  // Requirement questions
  /\b(apa\s+)?(syarat|persyaratan|dokumen|berkas)\b/i,
  /\b(biaya|tarif|harga|bayar)\s+(berapa|nya)\b/i,
  /\b(gratis|free|tidak\s+bayar)\b/i,
  
  // Process questions
  /\b(bagaimana|gimana)\s+(cara|proses|prosedur)\b/i,
  /\b(cara|proses|prosedur|langkah)\s+(buat|bikin|urus|daftar)\b/i,
  /\b(berapa\s+lama|durasi|waktu\s+proses)\b/i,
];

// ==================== ENTITY EXTRACTION ====================

/**
 * Extract complaint category from message
 */
function extractComplaintCategory(message: string): string | null {
  const categoryPatterns: Record<string, RegExp[]> = {
    'jalan_rusak': [
      /\b(jalan|aspal)\s+(rusak|berlubang|retak|hancur|jelek)\b/i,
      /\b(lubang|kerusakan)\s+(jalan|aspal)\b/i,
    ],
    'lampu_mati': [
      /\b(lampu|penerangan)\s+(jalan\s+)?(mati|padam|rusak|tidak\s+menyala)\b/i,
      /\b(pju|lampu\s+jalan)\s+(mati|padam)\b/i,
    ],
    'sampah': [
      /\b(sampah)\s+(menumpuk|berserakan|banyak|tidak\s+diangkut)\b/i,
      /\b(tumpukan|timbunan)\s+(sampah)\b/i,
    ],
    'drainase': [
      /\b(saluran|got|selokan|drainase)\s+(tersumbat|mampet|macet|buntu)\b/i,
      /\b(air|genangan)\s+(tidak\s+mengalir|meluap)\b/i,
    ],
    'pohon_tumbang': [
      /\b(pohon)\s+(tumbang|roboh|patah|miring|bahaya)\b/i,
    ],
    'banjir': [
      /\b(banjir|genangan\s+air|air\s+naik)\b/i,
    ],
    'fasilitas_rusak': [
      /\b(fasilitas|taman|pagar|bangku|trotoar)\s+(rusak|jelek|hancur)\b/i,
    ],
  };
  
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return category;
      }
    }
  }
  
  return null;
}

/**
 * Extract service code from message
 */
function extractServiceCode(message: string): string | null {
  const servicePatterns: Record<string, RegExp[]> = {
    'SKD': [/\b(skd|domisili|keterangan\s+domisili)\b/i],
    'SKTM': [/\b(sktm|tidak\s+mampu|keterangan\s+tidak\s+mampu)\b/i],
    'SKU': [/\b(sku|usaha|keterangan\s+usaha)\b/i],
    'SKBM': [/\b(skbm|belum\s+menikah|belum\s+nikah)\b/i],
    'SPKTP': [/\b(spktp|pengantar\s+ktp|ktp\s+baru|perpanjang\s+ktp)\b/i],
    'SPKK': [/\b(spkk|pengantar\s+kk|kartu\s+keluarga)\b/i],
    'SPSKCK': [/\b(spskck|pengantar\s+skck|skck)\b/i],
    'SPAKTA': [/\b(spakta|pengantar\s+akta|akta\s+kelahiran|akta\s+kematian)\b/i],
    'IKR': [/\b(ikr|izin\s+keramaian|acara)\b/i],
    'SKK': [/\b(skk|keterangan\s+kematian)\b/i],
    'SPP': [/\b(spp|pengantar\s+pindah|pindah\s+domisili)\b/i],
  };
  
  for (const [code, patterns] of Object.entries(servicePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return code;
      }
    }
  }
  
  return null;
}

/**
 * Extract complaint/reservation ID from message
 */
function extractIds(message: string): { complaintId?: string; reservationId?: string } {
  const result: { complaintId?: string; reservationId?: string } = {};
  
  const lapMatch = message.match(/\b(LAP-\d{8}-\d{3})\b/i);
  if (lapMatch) result.complaintId = lapMatch[1].toUpperCase();
  
  const rsvMatch = message.match(/\b(RSV-\d{8}-\d{3})\b/i);
  if (rsvMatch) result.reservationId = rsvMatch[1].toUpperCase();
  
  return result;
}

/**
 * Extract NIK from message
 */
function extractNIK(message: string): string | null {
  const nikMatch = message.match(/\b(\d{16})\b/);
  return nikMatch ? nikMatch[1] : null;
}

/**
 * Extract phone number from message
 */
function extractPhone(message: string): string | null {
  const phoneMatch = message.match(/\b(08\d{8,12})\b/);
  return phoneMatch ? phoneMatch[1] : null;
}

// ==================== MAIN CLASSIFIER ====================

/**
 * Fast classify intent using pattern matching
 * Returns null if no confident match found (should fallback to LLM)
 */
export function fastClassifyIntent(message: string): FastClassifyResult | null {
  const cleanMessage = message.trim();
  const lowerMessage = cleanMessage.toLowerCase();
  
  // Skip very long messages - let LLM handle complex queries
  if (cleanMessage.length > 300) {
    logger.debug('[FastClassifier] Message too long, skipping', { length: cleanMessage.length });
    return null;
  }
  
  // 1. Check GREETING (highest confidence for short greetings)
  if (cleanMessage.length < 30) {
    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(cleanMessage)) {
        return {
          intent: 'GREETING',
          confidence: 0.95,
          extractedFields: {},
          skipLLM: false, // Still use LLM for personalized greeting
          reason: 'Greeting pattern matched',
        };
      }
    }
  }
  
  // 2. Check CONFIRMATION (very short messages)
  if (cleanMessage.length < 20) {
    for (const pattern of CONFIRMATION_PATTERNS) {
      if (pattern.test(cleanMessage)) {
        return {
          intent: 'CONFIRMATION',
          confidence: 0.95,
          extractedFields: { isConfirmation: true },
          skipLLM: true, // Can handle without LLM
          reason: 'Confirmation pattern matched',
        };
      }
    }
    
    for (const pattern of REJECTION_PATTERNS) {
      if (pattern.test(cleanMessage)) {
        return {
          intent: 'REJECTION',
          confidence: 0.95,
          extractedFields: { isRejection: true },
          skipLLM: true,
          reason: 'Rejection pattern matched',
        };
      }
    }
    
    for (const pattern of THANKS_PATTERNS) {
      if (pattern.test(cleanMessage)) {
        return {
          intent: 'THANKS',
          confidence: 0.95,
          extractedFields: {},
          skipLLM: true,
          reason: 'Thanks pattern matched',
        };
      }
    }
  }
  
  // 3. Check CHECK_STATUS (with ID extraction)
  const ids = extractIds(cleanMessage);
  if (ids.complaintId || ids.reservationId) {
    return {
      intent: 'CHECK_STATUS',
      confidence: 0.95,
      extractedFields: {
        complaint_id: ids.complaintId,
        reservation_id: ids.reservationId,
      },
      skipLLM: true, // Can directly check status
      reason: 'Status check with ID detected',
    };
  }
  
  for (const pattern of CHECK_STATUS_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: 'CHECK_STATUS',
        confidence: 0.85,
        extractedFields: {},
        skipLLM: false, // Need LLM to ask for ID
        reason: 'Status check pattern matched',
      };
    }
  }
  
  // 4. Check CANCEL
  for (const pattern of CANCEL_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: ids.complaintId ? 'CANCEL_COMPLAINT' : ids.reservationId ? 'CANCEL_RESERVATION' : 'CANCEL',
        confidence: 0.85,
        extractedFields: {
          complaint_id: ids.complaintId,
          reservation_id: ids.reservationId,
        },
        skipLLM: !!(ids.complaintId || ids.reservationId),
        reason: 'Cancel pattern matched',
      };
    }
  }
  
  // 5. Check HISTORY
  for (const pattern of HISTORY_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: 'HISTORY',
        confidence: 0.9,
        extractedFields: {},
        skipLLM: true, // Can directly fetch history
        reason: 'History pattern matched',
      };
    }
  }
  
  // 6. Check CREATE_COMPLAINT (with category extraction)
  for (const pattern of CREATE_COMPLAINT_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      const kategori = extractComplaintCategory(lowerMessage);
      return {
        intent: 'CREATE_COMPLAINT',
        confidence: kategori ? 0.9 : 0.8,
        extractedFields: {
          kategori,
        },
        skipLLM: false, // Need LLM for address extraction and response
        reason: 'Complaint pattern matched' + (kategori ? ` (${kategori})` : ''),
      };
    }
  }
  
  // 7. Check CREATE_RESERVATION (with service code extraction)
  for (const pattern of CREATE_RESERVATION_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      const serviceCode = extractServiceCode(lowerMessage);
      const nik = extractNIK(cleanMessage);
      const phone = extractPhone(cleanMessage);
      
      return {
        intent: 'CREATE_RESERVATION',
        confidence: serviceCode ? 0.9 : 0.8,
        extractedFields: {
          service_code: serviceCode,
          nik,
          phone,
        },
        skipLLM: false, // Need LLM for data collection flow
        reason: 'Reservation pattern matched' + (serviceCode ? ` (${serviceCode})` : ''),
      };
    }
  }
  
  // 8. Check KNOWLEDGE_QUERY
  for (const pattern of KNOWLEDGE_QUERY_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: 'KNOWLEDGE_QUERY',
        confidence: 0.85,
        extractedFields: {},
        skipLLM: false, // Need LLM + RAG for knowledge response
        reason: 'Knowledge query pattern matched',
      };
    }
  }
  
  // No confident match - fallback to LLM
  logger.debug('[FastClassifier] No confident match, fallback to LLM', {
    messagePreview: cleanMessage.substring(0, 50),
  });
  
  return null;
}

/**
 * Check if message is a simple confirmation that can skip LLM
 */
export function isSimpleConfirmation(message: string): boolean {
  const result = fastClassifyIntent(message);
  return result?.intent === 'CONFIRMATION' && result.skipLLM === true;
}

/**
 * Check if message is a simple rejection
 */
export function isSimpleRejection(message: string): boolean {
  const result = fastClassifyIntent(message);
  return result?.intent === 'REJECTION' && result.skipLLM === true;
}

/**
 * Check if message is a thanks/closing
 */
export function isSimpleThanks(message: string): boolean {
  const result = fastClassifyIntent(message);
  return result?.intent === 'THANKS' && result.skipLLM === true;
}

export default {
  fastClassifyIntent,
  isSimpleConfirmation,
  isSimpleRejection,
  isSimpleThanks,
  extractComplaintCategory,
  extractServiceCode,
  extractIds,
  extractNIK,
  extractPhone,
};
