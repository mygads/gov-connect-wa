import { NextRequest, NextResponse } from 'next/server'

// API to trigger embedding generation for knowledge base
// Calls AI service to generate embeddings

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'govconnect-internal-2025-secret'

/**
 * POST /api/knowledge/embed-all
 * Trigger embedding generation for all knowledge items
 */
export async function POST(request: NextRequest) {
  try {
    // Call AI service to embed all knowledge
    const response = await fetch(`${AI_SERVICE_URL}/api/internal/embed-all-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': INTERNAL_API_KEY,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'AI service error')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} knowledge items`,
      processed: result.processed,
      failed: result.failed,
      total: result.total,
    })
  } catch (error: any) {
    console.error('Error triggering embedding:', error)
    
    // Better error message for connection refused
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        { 
          error: 'AI Service is not running', 
          details: `Cannot connect to AI Service at ${AI_SERVICE_URL}. Please start the AI Service first.`,
          hint: 'Run: cd govconnect-ai-service && pnpm run dev'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to trigger embedding', details: error.message },
      { status: 500 }
    )
  }
}
