import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to manage document chunks
// Uses internal API key for authentication

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'shared-secret-key-12345'

/**
 * POST /api/internal/documents/[id]/chunks
 * Store document chunks with embeddings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: documentId } = await params
    const body = await request.json()
    const { chunks } = body

    if (!chunks || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: 'Valid chunks array is required' },
        { status: 400 }
      )
    }

    // Verify document exists
    const document = await prisma.knowledge_documents.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete existing chunks for this document
    await prisma.$executeRaw`
      DELETE FROM dashboard.document_chunks
      WHERE document_id = ${documentId}
    `

    // Insert new chunks with embeddings
    for (const chunk of chunks) {
      const embeddingStr = chunk.embedding 
        ? `[${chunk.embedding.join(',')}]`
        : null

      await prisma.$executeRaw`
        INSERT INTO dashboard.document_chunks (
          id,
          document_id,
          chunk_index,
          content,
          embedding,
          embedding_model,
          page_number,
          section_title,
          created_at
        ) VALUES (
          ${chunk.id || `chunk_${Date.now()}_${chunk.chunkIndex}`},
          ${documentId},
          ${chunk.chunkIndex},
          ${chunk.content},
          ${embeddingStr}::vector,
          ${chunk.embeddingModel || 'gemini-embedding-001'},
          ${chunk.pageNumber || null},
          ${chunk.sectionTitle || null},
          NOW()
        )
      `
    }

    // Update document status
    await prisma.knowledge_documents.update({
      where: { id: documentId },
      data: {
        status: 'completed',
        total_chunks: chunks.length,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Chunks stored successfully',
      chunksCount: chunks.length,
    })
  } catch (error) {
    console.error('Error storing document chunks:', error)
    return NextResponse.json(
      { error: 'Failed to store chunks' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/internal/documents/[id]/chunks
 * Get chunks for a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id: documentId } = await params

    const chunks = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        chunk_index,
        content,
        page_number,
        section_title,
        embedding::text as embedding_text
      FROM dashboard.document_chunks
      WHERE document_id = ${documentId}
      ORDER BY chunk_index ASC
    `

    const formattedChunks = chunks.map(c => ({
      id: c.id,
      chunkIndex: c.chunk_index,
      content: c.content,
      pageNumber: c.page_number,
      sectionTitle: c.section_title,
      hasEmbedding: !!c.embedding_text,
    }))

    return NextResponse.json({
      data: formattedChunks,
      total: formattedChunks.length,
    })
  } catch (error) {
    console.error('Error getting document chunks:', error)
    return NextResponse.json(
      { error: 'Failed to get chunks' },
      { status: 500 }
    )
  }
}
