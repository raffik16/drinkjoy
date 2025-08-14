import { NextRequest, NextResponse } from 'next/server';
import { barDataService } from '@/lib/barDataService.server';
import type { BarsListResponse } from '@/app/types/bars';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false'; // Default to true

    console.log(`📍 API: Getting ${activeOnly ? 'active' : 'all'} bars`);

    const startTime = Date.now();
    
    if (activeOnly) {
      const bars = await barDataService.getActiveBars();
      const duration = Date.now() - startTime;
      
      console.log(`✅ API: Returned ${bars.length} active bars in ${duration}ms`);
      
      const response: BarsListResponse = {
        success: true,
        bars,
        count: bars.length
      };
      
      return NextResponse.json(response);
    } else {
      const { bars, source } = await barDataService.getAllBars();
      const duration = Date.now() - startTime;
      
      console.log(`✅ API: Returned ${bars.length} bars (${source}) in ${duration}ms`);
      
      const response: BarsListResponse = {
        success: true,
        bars,
        count: bars.length
      };
      
      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('❌ API Error in /api/bars:', error);
    
    const errorResponse: BarsListResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bars'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}