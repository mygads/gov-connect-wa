import { NextRequest, NextResponse } from 'next/server'

// In production, this would be stored in database
// For now, we store in environment variable via API
let adminSettings = {
  enabled: true,
  adminWhatsApp: process.env.ADMIN_WHATSAPP || '',
  soundEnabled: true,
  urgentCategories: [
    'bencana',
    'bencana_alam',
    'kebakaran',
    'kecelakaan',
    'keamanan',
    'kriminalitas',
    'kesehatan_darurat'
  ]
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: adminSettings
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Update settings
    adminSettings = {
      ...adminSettings,
      ...body
    }
    
    // In production, save to database here
    // Also update notification service config
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: adminSettings
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
