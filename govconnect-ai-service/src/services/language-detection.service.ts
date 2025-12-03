/**
 * Language Detection Service
 * 
 * Detects regional Indonesian languages/dialects for better understanding
 * Supports: Bahasa Sunda, Jawa, Betawi, Minang, Batak, Bali
 */

import logger from '../utils/logger';

export type DetectedLanguage = 
  | 'indonesian' 
  | 'sundanese' 
  | 'javanese' 
  | 'betawi' 
  | 'minang' 
  | 'batak'
  | 'balinese'
  | 'mixed';

export interface LanguageDetectionResult {
  primary: DetectedLanguage;
  confidence: number;  // 0-1
  detectedPatterns: string[];
  translation_hint?: string;  // Hint for LLM to understand
}

/**
 * Language patterns for detection
 * Each pattern includes common words/phrases and question words
 */
const LANGUAGE_PATTERNS: Record<DetectedLanguage, {
  patterns: RegExp[];
  questionWords: RegExp[];
  greetings: RegExp[];
  weight: number;  // Some languages have more unique markers
}> = {
  sundanese: {
    patterns: [
      /\b(teh|mah|atuh|euy|nya|lah|geuning|kumaha|naon|saha|mana|iraha|naha|ari|abdi|kuring|maneh|sia|anjeun)\b/gi,
      /\b(teu|henteu|moal|ulah|entong|ayeuna|kamari|isuk|pageto|wengi|beurang|siang)\b/gi,
      /\b(hatur|nuhun|punten|wilujeng|damang|sawios|mangga|sumangga)\b/gi,
      /\b(ka|ti|di|jeung|sareng|ku|kanggo|pikeun)\b/gi,
    ],
    questionWords: [
      /\b(naon|kumaha|saha|dimana|kamana|timana|iraha|naha|sabaraha|mana)\b/gi,
    ],
    greetings: [
      /\b(wilujeng|damang|punten|hatur nuhun|nuhun)\b/gi,
      /\bsampurasun\b/gi,
    ],
    weight: 1.0,
  },
  
  javanese: {
    patterns: [
      /\b(opo|piye|nggone|kapan|sopo|ngendi|piro|kok|wis|durung|ora|gak|yo|lho|rek|cak|geh)\b/gi,
      /\b(kulo|aku|kowe|sampeyan|panjenengan|ndiko|awakmu)\b/gi,
      /\b(matur|nuwun|nyuwun|mangga|monggo|sugeng|enjing|sonten|dalu|ndalu)\b/gi,
      /\b(iki|iku|kae|kuwi|sing|kang|ingkang|wonten|ana|neng|ning|lan|kalih)\b/gi,
    ],
    questionWords: [
      /\b(opo|piye|sopo|ngendi|kapan|piro|kok|geneya|kenopo)\b/gi,
    ],
    greetings: [
      /\b(sugeng|matur\s*nuwun|nyuwun\s*pangapunten|monggo|mangga)\b/gi,
    ],
    weight: 1.0,
  },
  
  betawi: {
    patterns: [
      /\b(gue|gua|lo|lu|elo|elu|die|nye|nye|ape|apaan|kagak|kaga|ogah|udeh|udah|bae|aje|doang|ama|sama)\b/gi,
      /\b(nyokap|bokap|bonyok|cuy|gaes|bray|gan|sis|mz|kk)\b/gi,
      /\b(emang|emangnya|makanya|gimana|gini|gitu|begitu|begini)\b/gi,
      /\b(ntar|bentar|entar|abis|abisan|kelar)\b/gi,
    ],
    questionWords: [
      /\b(apaan|ape|gimana|ngapain|kenape|mane|dimane|kapan)\b/gi,
    ],
    greetings: [
      /\b(eh|heh|oi|woi|bro|gan|cuy)\b/gi,
    ],
    weight: 0.8,  // Lower weight because some words overlap with informal Indonesian
  },
  
  minang: {
    patterns: [
      /\b(ndak|indak|tak|iyo|yo|doh|nian|bana|lah|ko|tu|do)\b/gi,
      /\b(ambo|awak|waang|ang|den|aden|kau|ang)\b/gi,
      /\b(baa|ba'a|sia|siapo|mano|kamano|kapan|bara|sapo)\b/gi,
      /\b(untuak|ka|dari|jo|samo|dek|demi)\b/gi,
    ],
    questionWords: [
      /\b(baa|apo|siapo|kamano|mano|bara|kapan)\b/gi,
    ],
    greetings: [
      /\b(assalamualaikum|kamano|lai)\b/gi,
    ],
    weight: 0.9,
  },
  
  batak: {
    patterns: [
      /\b(horas|molo|ndang|so|do|i|ma|au|ho|hamu|ibana|halak|roha|ate)\b/gi,
      /\b(aha|ise|dia|piga|andigan|boha|tudia|sadia)\b/gi,
      /\b(songon|laho|mangalap|mangido|mangan|margogo|maridi)\b/gi,
    ],
    questionWords: [
      /\b(aha|ise|dia|piga|andigan|boha|tudia)\b/gi,
    ],
    greetings: [
      /\b(horas|mejuah-juah|njuah-juah)\b/gi,
    ],
    weight: 1.0,
  },
  
  balinese: {
    patterns: [
      /\b(tiang|titiang|cang|icang|ragane|ida|dane|niki|puniki|nika|punika)\b/gi,
      /\b(napi|sapunapi|sira|ring|dija|pidan|kuda|nyen|kenken)\b/gi,
      /\b(suksma|matur|rahajeng|dumogi|swasti)\b/gi,
    ],
    questionWords: [
      /\b(napi|sapunapi|sira|dija|pidan|kuda|nyen|kenken)\b/gi,
    ],
    greetings: [
      /\b(om\s*swastiastu|rahajeng|suksma|matur\s*suksma)\b/gi,
    ],
    weight: 1.0,
  },
  
  indonesian: {
    patterns: [
      /\b(apa|siapa|dimana|kapan|bagaimana|mengapa|berapa|yang|dan|atau|ini|itu)\b/gi,
      /\b(saya|kami|kita|anda|mereka|dia|beliau)\b/gi,
      /\b(adalah|akan|sudah|sedang|telah|bisa|dapat|harus|mau|ingin)\b/gi,
    ],
    questionWords: [
      /\b(apa|siapa|dimana|di\s*mana|kapan|bagaimana|mengapa|kenapa|berapa)\b/gi,
    ],
    greetings: [
      /\b(halo|hai|selamat|terima\s*kasih|permisi|maaf)\b/gi,
    ],
    weight: 0.5,  // Lower weight as base language
  },
  
  mixed: {
    patterns: [],
    questionWords: [],
    greetings: [],
    weight: 0,
  },
};

/**
 * Translation hints for LLM to understand regional languages
 */
const TRANSLATION_HINTS: Record<DetectedLanguage, string> = {
  sundanese: `User berbicara dalam Bahasa Sunda. Beberapa kata kunci:
- "naon" = apa, "kumaha" = bagaimana, "saha" = siapa, "dimana/mana" = dimana
- "iraha" = kapan, "naha" = mengapa, "sabaraha" = berapa
- "teu/henteu" = tidak, "moal" = tidak akan, "ayeuna" = sekarang
- "hatur nuhun" = terima kasih, "punten" = permisi/maaf
- "wilujeng" = selamat, "damang" = sehat/baik-baik`,

  javanese: `User berbicara dalam Bahasa Jawa. Beberapa kata kunci:
- "opo/apa" = apa, "piye" = bagaimana, "sopo" = siapa, "ngendi" = dimana
- "kapan" = kapan, "piro" = berapa, "kenopo/geneya" = mengapa
- "ora/gak" = tidak, "wis" = sudah, "durung" = belum
- "matur nuwun" = terima kasih, "nyuwun pangapunten" = mohon maaf
- "monggo/mangga" = silakan, "sugeng" = selamat`,

  betawi: `User berbicara dalam dialek Betawi/Jakarta. Beberapa kata kunci:
- "ape/apaan" = apa, "gimana" = bagaimana, "mane/dimane" = dimana
- "kenape" = kenapa, "gue/gua" = saya, "lo/lu" = kamu
- "kagak/kaga" = tidak, "udeh/udah" = sudah, "bae/aje" = saja
- "ntar/bentar" = sebentar, "kelar" = selesai`,

  minang: `User berbicara dalam Bahasa Minang. Beberapa kata kunci:
- "apo" = apa, "baa/ba'a" = bagaimana, "siapo" = siapa, "mano" = dimana
- "kapan" = kapan, "bara" = berapa, "dek" = karena
- "ndak/indak" = tidak, "iyo" = iya, "bana/nian" = sangat
- "ambo/awak" = saya, "waang/ang" = kamu`,

  batak: `User berbicara dalam Bahasa Batak. Beberapa kata kunci:
- "aha" = apa, "ise" = siapa, "dia/tudia" = dimana, "piga" = berapa
- "andigan" = kapan, "boha" = bagaimana
- "ndang" = tidak, "so" = jadi/maka, "do" = lah (penegas)
- "horas" = salam Batak, "molo" = kalau/jika`,

  balinese: `User berbicara dalam Bahasa Bali. Beberapa kata kunci:
- "napi" = apa, "sira" = siapa, "dija" = dimana, "pidan" = kapan
- "kuda" = berapa, "kenken/sapunapi" = bagaimana
- "tiang/titiang" = saya (halus), "cang/icang" = saya (kasar)
- "suksma/matur suksma" = terima kasih, "rahajeng" = selamat`,

  indonesian: '',
  mixed: 'User menggunakan campuran Bahasa Indonesia dan bahasa daerah.',
};

/**
 * Detect the language of a message
 */
export function detectLanguage(message: string): LanguageDetectionResult {
  if (!message || message.trim().length < 3) {
    return {
      primary: 'indonesian',
      confidence: 1.0,
      detectedPatterns: [],
    };
  }

  const scores: Record<DetectedLanguage, { score: number; patterns: string[] }> = {
    sundanese: { score: 0, patterns: [] },
    javanese: { score: 0, patterns: [] },
    betawi: { score: 0, patterns: [] },
    minang: { score: 0, patterns: [] },
    batak: { score: 0, patterns: [] },
    balinese: { score: 0, patterns: [] },
    indonesian: { score: 0, patterns: [] },
    mixed: { score: 0, patterns: [] },
  };

  // Check each language
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    if (lang === 'mixed') continue;
    
    const langKey = lang as DetectedLanguage;
    
    // Check greetings (high weight)
    for (const pattern of config.greetings) {
      const matches = message.match(pattern);
      if (matches) {
        scores[langKey].score += matches.length * 3 * config.weight;
        scores[langKey].patterns.push(...matches);
      }
    }
    
    // Check question words (medium weight)
    for (const pattern of config.questionWords) {
      const matches = message.match(pattern);
      if (matches) {
        scores[langKey].score += matches.length * 2 * config.weight;
        scores[langKey].patterns.push(...matches);
      }
    }
    
    // Check general patterns (low weight)
    for (const pattern of config.patterns) {
      const matches = message.match(pattern);
      if (matches) {
        scores[langKey].score += matches.length * config.weight;
        scores[langKey].patterns.push(...matches);
      }
    }
  }

  // Find the highest scoring language
  let maxScore = 0;
  let primaryLang: DetectedLanguage = 'indonesian';
  let secondaryScore = 0;

  for (const [lang, data] of Object.entries(scores)) {
    if (lang === 'indonesian' || lang === 'mixed') continue;
    
    if (data.score > maxScore) {
      secondaryScore = maxScore;
      maxScore = data.score;
      primaryLang = lang as DetectedLanguage;
    } else if (data.score > secondaryScore) {
      secondaryScore = data.score;
    }
  }

  // Calculate confidence
  const totalWords = message.split(/\s+/).length;
  const confidence = Math.min(1, maxScore / (totalWords * 2));

  // Check if it's mixed (multiple regional languages detected)
  if (secondaryScore > maxScore * 0.5 && secondaryScore > 2) {
    primaryLang = 'mixed';
  }

  // If score is too low, default to Indonesian
  if (maxScore < 2) {
    primaryLang = 'indonesian';
  }

  const result: LanguageDetectionResult = {
    primary: primaryLang,
    confidence: primaryLang === 'indonesian' ? 1.0 : confidence,
    detectedPatterns: scores[primaryLang]?.patterns || [],
  };

  // Add translation hint for regional languages
  if (primaryLang !== 'indonesian') {
    result.translation_hint = TRANSLATION_HINTS[primaryLang];
    
    logger.info('🌐 Regional language detected', {
      language: primaryLang,
      confidence: confidence.toFixed(2),
      patterns: result.detectedPatterns.slice(0, 5),
    });
  }

  return result;
}

/**
 * Get language context for LLM prompt injection
 */
export function getLanguageContext(detection: LanguageDetectionResult): string {
  if (detection.primary === 'indonesian' || !detection.translation_hint) {
    return '';
  }

  return `\n\n[BAHASA DAERAH TERDETEKSI: ${detection.primary.toUpperCase()}]
${detection.translation_hint}
Kata yang terdeteksi: ${detection.detectedPatterns.slice(0, 5).join(', ')}

INSTRUKSI: Pahami maksud user dalam bahasa daerah tersebut, tapi JAWAB dalam Bahasa Indonesia yang mudah dipahami.`;
}

/**
 * Check if message contains regional language
 */
export function hasRegionalLanguage(message: string): boolean {
  const detection = detectLanguage(message);
  return detection.primary !== 'indonesian' && detection.confidence > 0.3;
}
