/**
 * Knowledge Feedback API for GovConnect Dashboard
 * 
 * Internal API to record user feedback for knowledge items
 * Used to improve quality scoring over time
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'govconnect-internal-key-2024'

function verifyInternalKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-internal-api-key')
  return apiKey === INTERNAL_API_KEY
}

/**
 * POST /api/internal/knowledge/[id]/feedback
 * Record user feedback for a knowledge response
 * 
 * Body: { feedback: -1 | 0 | 1 }
 * -1 = negative (not helpful)
 *  0 = neutral
 *  1 = positive (helpful)
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
    const { feedback } = body

    if (feedback === undefined || ![-1, 0, 1].includes(feedback)) {
      return NextResponse.json(
        { error: 'Invalid feedback. Must be -1, 0, or 1' },
        { status: 400 }
      )
    }

    // Get current feedback score
    const knowledge = await prisma.knowledge_base.findUnique({
      where: { id },
      select: {
        feedback_score: true,
        usage_count: true,
      },
    })

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 })
    }

    // Calculate new feedback score (exponential moving average)
    // This gives more weight to recent feedback
    const alpha = 0.3 // Weight for new feedback
    const currentScore = knowledge.feedback_score ?? 0
    const newScore = currentScore * (1 - alpha) + feedback * alpha

    // Update feedback score
    await prisma.knowledge_base.update({
      where: { id },
      data: {
        feedback_score: newScore,
        // Also update quality score based on feedback
        quality_score: calculateNewQualityScore(
          knowledge.usage_count,
          newScore
        ),
      },
    })

    return NextResponse.json({
      success: true,
      previousScore: currentScore,
      newScore,
    })
  } catch (error: any) {
    console.error('Error recording feedback:', error)
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    )
  }
}

/**
 * Calculate quality score based on metrics
 */
function calculateNewQualityScore(
  usageCount: number,
  feedbackScore: number
): number {
  // Base score starts at 0.5
  let score = 0.5

  // Usage frequency boost (max +0.2)
  const usageBoost = Math.min(0.2, Math.log10(usageCount + 1) * 0.1)
  score += usageBoost

  // Feedback boost/penalty (±0.15)
  score += feedbackScore * 0.15

  // Clamp to [0.1, 1.0]
  return Math.max(0.1, Math.min(1.0, score))
}
