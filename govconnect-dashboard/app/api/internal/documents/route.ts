import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to manage documents
// Uses internal API key for authentication

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'govconnect-internal-2025-secret'

/**
 * GET /api/internal/documents
 * Get all documents for AI service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    if (status) where.status = status

    const documents = await prisma.knowledge_documents.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      data: documents,
      total: documents.length,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/internal/documents
 * Create a document record (used by AI service after processing)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      filename, 
      original_name, 
      mime_type, 
      file_size, 
      file_url,
      title,
      description,
      category,
      status = 'pending'
    } = body

    const document = await prisma.knowledge_documents.create({
      data: {
        filename,
        original_name,
        mime_type,
        file_size,
        file_url,
        title,
        description,
        category,
        status,
      },
    })

    return NextResponse.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
