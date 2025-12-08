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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await channel.disconnect()
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect WhatsApp' },
      { status: 500 }
    )
  }
}
