import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to get single knowledge item
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'govconnect-internal-2025-secret'

/**
 * GET /api/internal/knowledge/[id]
 * Get a single knowledge item by ID
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

    const { id } = await params

    const knowledge = await prisma.knowledge_base.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        keywords: true,
        is_active: true,
        priority: true,
      },
    })

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 })
    }

    return NextResponse.json({ data: knowledge })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge' },
      { status: 500 }
    )
  }
}
