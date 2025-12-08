import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateKnowledgeVector, deleteKnowledgeVector } from '@/lib/ai-service'

// Knowledge categories
const VALID_CATEGORIES = [
  'informasi_umum',
  'layanan', 
  'prosedur',
  'jadwal',
  'kontak',
  'faq',
]

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
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

    const knowledge = await prisma.knowledge_base.findUnique({
      where: { id },
    })

    if (!knowledge) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: knowledge,
    })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
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

    const body = await request.json()
    const { title, content, category, keywords, is_active, priority } = body

    // Check if knowledge exists
    const existing = await prisma.knowledge_base.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 })
    }

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Process keywords if provided
    const processedKeywords = keywords 
      ? keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean)
      : undefined

    // Update knowledge entry
    const knowledge = await prisma.knowledge_base.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(processedKeywords && { keywords: processedKeywords }),
        ...(is_active !== undefined && { is_active }),
        ...(priority !== undefined && { priority }),
        admin_id: payload.adminId,
      },
    })

    // Sync to AI Service - re-embed with new content
    updateKnowledgeVector(id, {
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category,
      keywords: knowledge.keywords,
    }).catch(err => {
      console.error('Failed to sync knowledge update to AI Service:', err)
    })

    return NextResponse.json({
      status: 'success',
      data: knowledge,
    })
  } catch (error) {
    console.error('Error updating knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to update knowledge' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
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

    // Check if knowledge exists
    const existing = await prisma.knowledge_base.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 })
    }

    // Delete knowledge entry
    await prisma.knowledge_base.delete({
      where: { id },
    })

    // Delete from AI Service vector database
    deleteKnowledgeVector(id).catch(err => {
      console.error('Failed to delete knowledge from AI Service:', err)
    })

    return NextResponse.json({
      status: 'success',
      message: 'Knowledge deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to delete knowledge' },
      { status: 500 }
    )
  }
}
