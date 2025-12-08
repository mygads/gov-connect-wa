import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { addKnowledgeVector } from '@/lib/ai-service'

// Knowledge categories
const VALID_CATEGORIES = [
  'informasi_umum',
  'layanan', 
  'prosedur',
  'jadwal',
  'kontak',
  'faq',
]

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (isActive !== null) {
      where.is_active = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { keywords: { has: search.toLowerCase() } },
      ]
    }

    // Get knowledge entries
    const [knowledge, total] = await Promise.all([
      prisma.knowledge_base.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { updated_at: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.knowledge_base.count({ where }),
    ])

    return NextResponse.json({
      data: knowledge,
      pagination: {
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Process keywords - ensure lowercase
    const processedKeywords = Array.isArray(keywords) 
      ? keywords.map((k: string) => k.toLowerCase().trim()).filter(Boolean)
      : []

    // Create knowledge entry
    const knowledge = await prisma.knowledge_base.create({
      data: {
        title,
        content,
        category,
        keywords: processedKeywords,
        is_active: is_active ?? true,
        priority: priority ?? 0,
        admin_id: payload.adminId,
      },
    })

    // Sync to AI Service vector database (fire and forget)
    addKnowledgeVector({
      id: knowledge.id,
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category,
      keywords: knowledge.keywords,
    }).catch(err => {
      console.error('Failed to sync knowledge to AI Service:', err)
    })

    return NextResponse.json({
      status: 'success',
      data: knowledge,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to create knowledge' },
      { status: 500 }
    )
  }
}
