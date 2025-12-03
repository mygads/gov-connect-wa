import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to get knowledge embeddings
// Uses internal API key for authentication

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'shared-secret-key-12345'

/**
 * GET /api/internal/knowledge/embeddings
 * Get all knowledge items with embeddings for caching
 */
export async function GET(request: NextRequest) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all active knowledge with embeddings
    // Using raw query because Prisma doesn't support vector type directly
    const knowledge = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        title,
        content,
        category,
        keywords,
        embedding::text as embedding_text
      FROM dashboard.knowledge_base
      WHERE is_active = true
        AND embedding IS NOT NULL
      ORDER BY priority DESC, updated_at DESC
    `

    // Parse embedding from text format
    const formattedKnowledge = knowledge.map(k => ({
      id: k.id,
      title: k.title,
      content: k.content,
      category: k.category,
      keywords: k.keywords,
      embedding: k.embedding_text 
        ? JSON.parse(k.embedding_text.replace('[', '[').replace(']', ']'))
        : null,
    }))

    return NextResponse.json({
      data: formattedKnowledge,
      total: formattedKnowledge.length,
    })
  } catch (error) {
    console.error('Error getting knowledge embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to get knowledge embeddings' },
      { status: 500 }
    )
  }
}
