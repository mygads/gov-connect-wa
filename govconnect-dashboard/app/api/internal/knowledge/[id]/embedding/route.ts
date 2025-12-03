import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to update knowledge embedding
// Uses internal API key for authentication

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'shared-secret-key-12345'

/**
 * PUT /api/internal/knowledge/[id]/embedding
 * Update embedding for a knowledge item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { embedding, model = 'gemini-embedding-001' } = body

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: 'Valid embedding array is required' },
        { status: 400 }
      )
    }

    // Convert to pgvector format
    const embeddingStr = `[${embedding.join(',')}]`

    // Update embedding using raw query (Prisma doesn't support vector type)
    await prisma.$executeRaw`
      UPDATE dashboard.knowledge_base
      SET 
        embedding = ${embeddingStr}::vector,
        embedding_model = ${model},
        last_embedded_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: 'Embedding updated successfully',
    })
  } catch (error) {
    console.error('Error updating knowledge embedding:', error)
    return NextResponse.json(
      { error: 'Failed to update embedding' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/internal/knowledge/[id]/embedding
 * Remove embedding for a knowledge item
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

    const { id } = await params

    // Remove embedding
    await prisma.$executeRaw`
      UPDATE dashboard.knowledge_base
      SET 
        embedding = NULL,
        embedding_model = NULL,
        last_embedded_at = NULL,
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: 'Embedding removed successfully',
    })
  } catch (error) {
    console.error('Error removing knowledge embedding:', error)
    return NextResponse.json(
      { error: 'Failed to remove embedding' },
      { status: 500 }
    )
  }
}
