import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to delete document embeddings
// Uses internal API key for authentication

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'shared-secret-key-12345'

/**
 * DELETE /api/internal/documents/[id]/embeddings
 * Delete all embeddings for a document (and its chunks)
 */
export async function DELETE(
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

    // Delete all chunks for this document
    await prisma.$executeRaw`
      DELETE FROM dashboard.document_chunks
      WHERE document_id = ${documentId}
    `

    // Reset document processing status
    await prisma.knowledge_documents.update({
      where: { id: documentId },
      data: {
        status: 'pending',
        total_chunks: 0,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Document embeddings deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting document embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to delete embeddings' },
      { status: 500 }
    )
  }
}
