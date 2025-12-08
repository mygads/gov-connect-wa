import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { ai } from '@/lib/api-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    const { model } = await params

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if superadmin
    if (payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    // Try to forward request to AI service
    try {
      const response = await ai.getModelStats(model)

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }

      if (response.status === 404) {
        return NextResponse.json({
          error: 'Model not found',
          model,
          message: 'No statistics recorded for this model yet',
        }, { status: 404 })
      }

      // If AI service returns error, return the error message
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        error: 'AI service error',
        status: response.status,
        message: errorData.message || 'Failed to fetch model stats'
      }, { status: response.status })
    } catch (error) {
      console.log('AI service not available:', error)
      
      return NextResponse.json({
        error: 'AI service is currently offline',
        model,
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Error fetching model stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model statistics' },
      { status: 500 }
    )
  }
}
