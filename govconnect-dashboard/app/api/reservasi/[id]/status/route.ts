import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { buildUrl, ServicePath, getHeaders, apiFetch } from '@/lib/api-client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    try {
      const response = await apiFetch(buildUrl(ServicePath.CASE, `/reservasi/${id}/status`), {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Case service not available')
    }

    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  } catch (error) {
    console.error('Error updating reservasi status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
