import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to get document embeddings
// Uses internal API key for authentication

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'shared-secret-key-12345'

/**
 * GET /api/internal/documents/embeddings
 * Get all document chunks with embeddings for caching
 */
export async function GET(request: NextRequest) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all document chunks with embeddings
    const chunks = await prisma.$queryRaw<any[]>`
      SELECT 
        dc.id,
        dc.document_id,
        dc.content,
        dc.chunk_index,
        dc.page_number,
        dc.section_title,
        dc.embedding::text as embedding_text,
        kd.title as document_title,
        kd.category
      FROM dashboard.document_chunks dc
      JOIN dashboard.knowledge_documents kd ON dc.document_id = kd.id
      WHERE kd.status = 'completed'
        AND dc.embedding IS NOT NULL
      ORDER BY kd.created_at DESC, dc.chunk_index ASC
    `

    // Parse embedding from text format
    const formattedChunks = chunks.map(c => ({
      id: c.id,
      documentId: c.document_id,
      documentTitle: c.document_title,
      content: c.content,
      chunkIndex: c.chunk_index,
      pageNumber: c.page_number,
      sectionTitle: c.section_title,
      category: c.category,
      embedding: c.embedding_text 
        ? JSON.parse(c.embedding_text.replace('[', '[').replace(']', ']'))
        : null,
    }))

    return NextResponse.json({
      data: formattedChunks,
      total: formattedChunks.length,
    })
  } catch (error) {
    console.error('Error getting document embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to get document embeddings' },
      { status: 500 }
    )
  }
}
