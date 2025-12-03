import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Internal API for AI service to perform vector search
// Uses internal API key for authentication

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'shared-secret-key-12345'

/**
 * POST /api/internal/vector-search
 * Perform semantic search using pgvector
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal API key
    const apiKey = request.headers.get('x-internal-api-key')
    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      embedding, 
      topK = 5, 
      minScore = 0.7, 
      categories,
      sourceTypes = ['knowledge', 'document'] 
    } = body

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: 'Valid embedding array is required' },
        { status: 400 }
      )
    }

    // Convert embedding array to pgvector format
    const embeddingStr = `[${embedding.join(',')}]`
    
    const results: any[] = []

    // Search knowledge base
    if (sourceTypes.includes('knowledge')) {
      let knowledgeQuery = `
        SELECT 
          id,
          title as source,
          content,
          category,
          keywords as metadata,
          1 - (embedding <=> $1::vector) as score,
          'knowledge' as source_type
        FROM dashboard.knowledge_base
        WHERE is_active = true
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> $1::vector) >= $2
      `
      
      const params: any[] = [embeddingStr, minScore]
      
      if (categories && categories.length > 0) {
        knowledgeQuery += ` AND category = ANY($3)`
        params.push(categories)
      }
      
      knowledgeQuery += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`
      params.push(topK)

      try {
        const knowledgeResults = await prisma.$queryRawUnsafe<any[]>(
          knowledgeQuery,
          ...params
        )
        
        results.push(...knowledgeResults.map(r => ({
          id: r.id,
          content: r.content,
          score: parseFloat(r.score),
          source: r.source,
          sourceType: 'knowledge',
          metadata: {
            category: r.category,
            keywords: r.metadata,
          },
        })))
      } catch (error) {
        console.error('Knowledge vector search error:', error)
        // Continue with document search
      }
    }

    // Search document chunks
    if (sourceTypes.includes('document')) {
      let documentQuery = `
        SELECT 
          dc.id,
          dc.content,
          dc.section_title,
          dc.page_number,
          dc.chunk_index,
          kd.id as document_id,
          kd.title as document_title,
          kd.category,
          1 - (dc.embedding <=> $1::vector) as score,
          'document' as source_type
        FROM dashboard.document_chunks dc
        JOIN dashboard.knowledge_documents kd ON dc.document_id = kd.id
        WHERE kd.status = 'completed'
          AND dc.embedding IS NOT NULL
          AND 1 - (dc.embedding <=> $1::vector) >= $2
      `
      
      const params: any[] = [embeddingStr, minScore]
      
      if (categories && categories.length > 0) {
        documentQuery += ` AND kd.category = ANY($3)`
        params.push(categories)
      }
      
      documentQuery += ` ORDER BY dc.embedding <=> $1::vector LIMIT $${params.length + 1}`
      params.push(topK)

      try {
        const documentResults = await prisma.$queryRawUnsafe<any[]>(
          documentQuery,
          ...params
        )
        
        results.push(...documentResults.map(r => ({
          id: r.id,
          content: r.content,
          score: parseFloat(r.score),
          source: r.document_title || 'Document',
          sourceType: 'document',
          metadata: {
            documentId: r.document_id,
            chunkIndex: r.chunk_index,
            pageNumber: r.page_number,
            sectionTitle: r.section_title,
            category: r.category,
          },
        })))
      } catch (error) {
        console.error('Document vector search error:', error)
        // Continue with what we have
      }
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score)
    const finalResults = results.slice(0, topK)

    return NextResponse.json({
      data: finalResults,
      total: finalResults.length,
    })
  } catch (error) {
    console.error('Error in vector search:', error)
    return NextResponse.json(
      { error: 'Failed to perform vector search', details: String(error) },
      { status: 500 }
    )
  }
}
