import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'
import { deleteDocumentVectors } from '@/lib/ai-service'

/**
 * GET /api/documents/[id]
 * Get a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const document = await prisma.knowledge_documents.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Get chunks count
    const chunksCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM dashboard.document_chunks WHERE document_id = ${id}
    `

    return NextResponse.json({
      data: {
        ...document,
        chunks_count: Number(chunksCount[0]?.count || 0),
      },
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/documents/[id]
 * Update document metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, category } = body

    const document = await prisma.knowledge_documents.update({
      where: { id },
      data: {
        title,
        description,
        category,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document and its file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get document to find file path
    const document = await prisma.knowledge_documents.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete chunks first
    await prisma.$executeRaw`
      DELETE FROM dashboard.document_chunks WHERE document_id = ${id}
    `

    // Delete document record
    await prisma.knowledge_documents.delete({
      where: { id },
    })

    // Delete vectors from AI Service
    deleteDocumentVectors(id).catch(err => {
      console.error('Failed to delete document vectors from AI Service:', err)
    })

    // Try to delete file (don't fail if file doesn't exist)
    try {
      const filePath = path.join(process.cwd(), 'public', document.file_url)
      await unlink(filePath)
    } catch (e) {
      console.warn('Could not delete file:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
