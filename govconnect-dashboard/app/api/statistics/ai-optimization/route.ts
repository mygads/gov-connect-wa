import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';

/**
 * GET /api/statistics/ai-optimization
 * Fetch AI optimization stats from AI Service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch optimization stats from AI Service
    const response = await fetch(`${AI_SERVICE_URL}/stats/optimization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Return empty stats if AI service is unavailable
      return NextResponse.json({
        cache: {
          totalHits: 0,
          totalMisses: 0,
          hitRate: 0,
          cacheSize: 0,
          avgHitCount: 0,
        },
        topCachedQueries: [],
        error: 'AI Service unavailable',
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to fetch AI optimization stats:', error.message);
    
    // Return empty stats on error
    return NextResponse.json({
      cache: {
        totalHits: 0,
        totalMisses: 0,
        hitRate: 0,
        cacheSize: 0,
        avgHitCount: 0,
      },
      topCachedQueries: [],
      error: error.message,
    });
  }
}
