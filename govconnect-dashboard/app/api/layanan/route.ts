import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { buildUrl, ServicePath, getHeaders, apiFetch } from '@/lib/api-client'

export async function GET(request: NextRequest) {
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

    try {
      const response = await apiFetch(buildUrl(ServicePath.CASE, '/reservasi/services'), {
        headers: getHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Case service not available for layanan')
    }

    return NextResponse.json({ data: [] })
  } catch (error) {
    console.error('Error fetching layanan:', error)
    return NextResponse.json({ error: 'Failed to fetch layanan' }, { status: 500 })
  }
}
