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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || undefined
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined

    try {
      const url = new URL(buildUrl(ServicePath.CASE, '/reservasi'))
      if (status) url.searchParams.set('status', status)
      if (date_from) url.searchParams.set('date_from', date_from)
      if (date_to) url.searchParams.set('date_to', date_to)

      const response = await apiFetch(url.toString(), {
        headers: getHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Case service not available for reservasi')
    }

    return NextResponse.json({
      data: [],
      pagination: { total: 0, limit: 20, offset: 0 }
    })
  } catch (error) {
    console.error('Error fetching reservasi:', error)
    return NextResponse.json({ error: 'Failed to fetch reservasi' }, { status: 500 })
  }
}
