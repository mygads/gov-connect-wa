/**
 * Knowledge Metrics API for GovConnect Dashboard
 * 
 * Internal API to track knowledge base usage and quality metrics
 * Used by AI service to record retrievals, usage, and feedback
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'govconnect-internal-key-2024'

function verifyInternalKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-internal-api-key')
  return apiKey === INTERNAL_API_KEY
}

/**
 * GET /api/internal/knowledge/[id]/metrics
 * Get quality metrics for a knowledge item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyInternalKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { id } = await params
    
    const knowledge = await prisma.knowledge_base.findUnique({
      where: { id },
      select: {
        id: true,
        quality_score: true,
        usage_count: true,
        retrieval_count: true,
        click_count: true,
        last_retrieved: true,
        feedback_score: true,
      },
    })

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: knowledge.id,
      qualityScore: knowledge.quality_score,
      usageCount: knowledge.usage_count,
      retrievalCount: knowledge.retrieval_count,
      clickCount: knowledge.click_count,
      lastRetrieved: knowledge.last_retrieved,
      feedbackScore: knowledge.feedback_score,
    })
  } catch (error: any) {
    console.error('Error fetching knowledge metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/internal/knowledge/[id]/metrics
 * Record a metric event (retrieval or usage)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyInternalKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['retrieval', 'usage'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "retrieval" or "usage"' },
        { status: 400 }
      )
    }

    // Update metrics based on action
    if (action === 'retrieval') {
      await prisma.knowledge_base.update({
        where: { id },
        data: {
          retrieval_count: { increment: 1 },
          last_retrieved: new Date(),
        },
      })
    } else if (action === 'usage') {
      await prisma.knowledge_base.update({
        where: { id },
        data: {
          usage_count: { increment: 1 },
          click_count: { increment: 1 },
          last_retrieved: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true, action })
  } catch (error: any) {
    console.error('Error recording metric:', error)
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}
