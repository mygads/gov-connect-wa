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

// GET - Fetch current settings
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await channel.getSettings()
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch WhatsApp settings' },
      { status: 500 }
    )
  }
}

// PATCH - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const response = await channel.updateSettings(body)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update WhatsApp settings' },
      { status: 500 }
    )
  }
}
