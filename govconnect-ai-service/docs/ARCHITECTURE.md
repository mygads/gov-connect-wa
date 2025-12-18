# GovConnect AI Service - Architecture Documentation

## Overview

GovConnect AI Service adalah layanan AI untuk memproses pesan dari berbagai channel (WhatsApp, Webchat) dengan dukungan untuk dua arsitektur LLM.

## Architecture Options

### 1. Single-Layer Architecture (Default untuk Webchat)

```
User Message → Unified Message Processor → LLM (Gemini) → Response
                      ↓
              - Fast Intent Classifier
              - Entity Extractor
              - RAG/Knowledge Service
              - Response Templates
```

**Karakteristik:**
- Satu panggilan LLM per request
- Latency lebih rendah
- Cost lebih rendah
- Cocok untuk synchronous HTTP requests (Webchat)

**File Utama:**
- `unified-message-processor.service.ts`
- `llm.service.ts`
- `prompts/system-prompt.ts`

### 2. Two-Layer Architecture (Default untuk WhatsApp)

```
User Message → Layer 1 (Intent & Understanding) → Layer 2 (Response Generation) → Response
                      ↓                                    ↓
              - Intent Classification              - Natural Response
              - Data Extraction                    - Conversation Flow
              - Typo Correction                    - Proactive Guidance
              - Confidence Scoring
```

**Karakteristik:**
- Dua panggilan LLM per request
- Accuracy lebih tinggi
- Better data extraction
- Cocok untuk async processing (WhatsApp via RabbitMQ)

**File Utama:**
- `two-layer-orchestrator.service.ts`
- `layer1-llm.service.ts`
- `layer2-llm.service.ts`

## Environment Variables

```bash
# Unified Architecture Selection (controls BOTH WhatsApp AND Webchat)
USE_2_LAYER_ARCHITECTURE=true  # true = 2-Layer, false = Single-Layer
```

**Note:** Satu environment variable mengontrol kedua channel (WhatsApp dan Webchat) untuk konsistensi.

## Shared Services (Consolidated)

Semua service berikut digunakan oleh kedua arsitektur:

### 1. Intent Patterns (`constants/intent-patterns.ts`)
Single source of truth untuk semua regex patterns:
- Greeting, Confirmation, Rejection, Thanks
- Complaint, Reservation, Status Check
- Cancel, History, Knowledge Query

### 2. Response Templates (`constants/response-templates.ts`)
Single source of truth untuk semua response templates:
- Fallback responses per intent
- Knowledge responses (jam buka, lokasi, layanan, dll)
- Missing field prompts
- Error templates

### 3. Entity Extractor (`entity-extractor.service.ts`)
Consolidated entity extraction:
- `extractAllEntities()` - Extract NIK, phone, name, address, date, time
- `extractCitizenDataFromHistory()` - Extract citizen data from conversation history

### 4. Text Normalizer (`text-normalizer.service.ts`)
Consolidated typo corrections:
- `normalizeText()` - Apply typo corrections
- `applyTypoCorrections()` - Legacy alias

### 5. Fast Intent Classifier (`fast-intent-classifier.service.ts`)
Pattern-based intent classification to skip LLM for clear intents:
- Uses centralized patterns from `constants/intent-patterns.ts`
- Returns confidence score and extracted fields

## Flow Diagrams

### WhatsApp Flow (2-Layer)

```
RabbitMQ Consumer
       ↓
processTwoLayerMessage()
       ↓
┌──────────────────┐
│ Pre-processing   │
│ - Spam check     │
│ - Typo correction│
│ - Entity extract │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Layer 1 LLM      │
│ - Intent classify│
│ - Data extraction│
│ - Confidence     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Enhancement      │
│ - History data   │
│ - Confidence adj │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Layer 2 LLM      │
│ - Response gen   │
│ - Guidance       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Action Handler   │
│ - Create complaint│
│ - Create reservation│
└────────┬─────────┘
         ↓
    RabbitMQ Reply
```

### Webchat Flow (Single-Layer)

```
HTTP POST /api/webchat
       ↓
processWebchatMessage()
       ↓
┌──────────────────┐
│ Pre-processing   │
│ - Fast classify  │
│ - Template match │
│ - Entity extract │
└────────┬─────────┘
         ↓
    Skip LLM? ──Yes──→ Template Response
         │
         No
         ↓
┌──────────────────┐
│ LLM Call         │
│ - Full system    │
│   prompt         │
│ - RAG context    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Action Handler   │
│ - Create complaint│
│ - Create reservation│
└────────┬─────────┘
         ↓
    HTTP Response
```

## Recommendations

### When to Use 2-Layer
- Complex conversations requiring high accuracy
- Multi-step data collection flows
- When cost is not a primary concern

### When to Use Single-Layer
- Simple queries (greetings, status checks)
- Low-latency requirements
- Cost-sensitive deployments

### Implemented Improvements

1. **Unified Architecture Control**: `USE_2_LAYER_ARCHITECTURE` controls both WhatsApp and Webchat
2. **Smart Router** (`smart-router.service.ts`): Analyzes message complexity for hybrid routing
3. **Response Caching** (`response-cache.service.ts`): Caches responses for frequent questions
4. **Analytics Dashboard**: `/stats/dashboard` endpoint for monitoring performance

### Future Improvements
1. **Streaming**: Implement streaming responses for better UX
2. **A/B Testing**: Compare accuracy between architectures
3. **Auto-tuning**: Automatically adjust routing thresholds based on performance

## File Structure

```
src/
├── constants/
│   ├── intent-patterns.ts      # Centralized intent patterns
│   └── response-templates.ts   # Centralized response templates
├── prompts/
│   └── system-prompt.ts        # Main system prompt for single-layer
├── services/
│   ├── ai-orchestrator.service.ts       # WhatsApp orchestrator
│   ├── two-layer-orchestrator.service.ts # 2-Layer orchestrator (WhatsApp async)
│   ├── two-layer-webchat.service.ts     # 2-Layer for webchat (sync)
│   ├── unified-message-processor.service.ts # Single-layer processor
│   ├── smart-router.service.ts          # Hybrid architecture routing
│   ├── response-cache.service.ts        # Response caching
│   ├── layer1-llm.service.ts            # Layer 1 LLM
│   ├── layer2-llm.service.ts            # Layer 2 LLM
│   ├── llm.service.ts                   # Main LLM service
│   ├── entity-extractor.service.ts      # Entity extraction
│   ├── text-normalizer.service.ts       # Text normalization
│   ├── fast-intent-classifier.service.ts # Fast intent classification
│   ├── fallback-response.service.ts     # Fallback responses
│   └── response-templates.service.ts    # Response templates
└── routes/
    └── webchat.routes.ts        # Webchat HTTP endpoint
```

## API Endpoints

### Dashboard & Analytics
- `GET /stats/dashboard` - Comprehensive dashboard with all stats
- `GET /stats/routing` - Smart routing statistics
- `POST /stats/analyze-complexity` - Analyze message complexity
- `GET /stats/optimization` - Cache and FSM stats
- `GET /stats/analytics` - AI analytics summary
