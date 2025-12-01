import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { config } from '../config/env';
import { LLMResponse, LLMResponseSchema, LLMMetrics } from '../types/llm-response.types';
import { JSON_SCHEMA_FOR_GEMINI } from '../prompts/system-prompt';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Call Gemini with structured JSON output
 * Uses primary model (gemini-2.5-flash) and falls back to gemini-2.0-flash on error
 */
export async function callGemini(systemPrompt: string): Promise<{ response: LLMResponse; metrics: LLMMetrics }> {
  const startTime = Date.now();
  
  // Try primary model first
  const result = await callGeminiWithModel(systemPrompt, config.llmModel, startTime);
  
  if (result.success) {
    return result.data!;
  }
  
  // If primary model fails, try fallback model
  logger.warn('⚠️ Primary model failed, trying fallback model', {
    primaryModel: config.llmModel,
    fallbackModel: config.llmFallbackModel,
  });
  
  const fallbackResult = await callGeminiWithModel(systemPrompt, config.llmFallbackModel, startTime);
  
  if (fallbackResult.success) {
    return fallbackResult.data!;
  }
  
  // Both models failed, return error response
  const endTime = Date.now();
  const durationMs = endTime - startTime;
  
  logger.error('❌ Both primary and fallback models failed', {
    primaryModel: config.llmModel,
    fallbackModel: config.llmFallbackModel,
    durationMs,
  });
  
  const fallbackResponse: LLMResponse = {
    intent: 'UNKNOWN',
    fields: {},
    reply_text: 'Maaf, saya sedang mengalami gangguan. Mohon coba lagi dalam beberapa saat atau hubungi staf kelurahan langsung.',
  };
  
  const metrics: LLMMetrics = {
    startTime,
    endTime,
    durationMs,
    model: `${config.llmModel} (failed) -> ${config.llmFallbackModel} (failed)`,
  };
  
  return {
    response: fallbackResponse,
    metrics,
  };
}

/**
 * Internal function to call Gemini with a specific model
 */
async function callGeminiWithModel(
  systemPrompt: string, 
  modelName: string, 
  startTime: number
): Promise<{ success: boolean; data?: { response: LLMResponse; metrics: LLMMetrics }; error?: string }> {
  logger.info('Calling Gemini API', {
    model: modelName,
    temperature: config.llmTemperature,
  });
  
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: config.llmTemperature,
        maxOutputTokens: config.llmMaxTokens,
        responseMimeType: 'application/json',
        responseSchema: JSON_SCHEMA_FOR_GEMINI as any,
      },
    });
    
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    
    logger.debug('Gemini raw response', {
      model: modelName,
      responseLength: responseText.length,
      durationMs,
    });
    
    // Parse JSON response
    const parsedResponse = JSON.parse(responseText);
    
    // Validate with Zod schema
    const validatedResponse = LLMResponseSchema.parse(parsedResponse);
    
    const metrics: LLMMetrics = {
      startTime,
      endTime,
      durationMs,
      model: modelName,
    };
    
    logger.info('✅ Gemini response parsed successfully', {
      model: modelName,
      intent: validatedResponse.intent,
      hasFields: Object.keys(validatedResponse.fields).length > 0,
      durationMs,
    });
    
    return {
      success: true,
      data: {
        response: validatedResponse,
        metrics,
      },
    };
  } catch (error: any) {
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    
    logger.error('❌ Gemini API call failed', {
      model: modelName,
      error: error.message,
      durationMs,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle LLM errors and provide appropriate fallback
 */
export function handleLLMError(error: any): LLMResponse {
  logger.error('LLM error handler', {
    errorType: error.constructor.name,
    message: error.message,
  });
  
  return {
    intent: 'UNKNOWN',
    fields: {},
    reply_text: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi atau hubungi layanan pelanggan.',
  };
}
