import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { channel } from '@/lib/api-client'

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  return await verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await channel.getQR()
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch QR code' },
      { status: 500 }
    )
  }
}
