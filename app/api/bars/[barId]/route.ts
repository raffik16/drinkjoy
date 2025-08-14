import { NextRequest, NextResponse } from 'next/server';
import { barDataService } from '@/lib/barDataService.server';
import type { BarResponse } from '@/app/types/bars';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ barId: string }> }
) {
  const { barId } = await params;
  
  try {
    if (!barId) {
      const errorResponse: BarResponse = {
        success: false,
        error: 'Bar ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log(`📍 API: Getting bar ${barId}`);

    const startTime = Date.now();
    const bar = await barDataService.getBarById(barId);
    const duration = Date.now() - startTime;

    if (!bar) {
      console.log(`❌ API: Bar ${barId} not found`);
      
      const errorResponse: BarResponse = {
        success: false,
        error: 'Bar not found'
      };
      
      return NextResponse.json(errorResponse, { status: 404 });
    }

    console.log(`✅ API: Found bar ${bar.name} in ${duration}ms`);

    // Track analytics if available
    if (typeof globalThis !== 'undefined' && 'gtag' in globalThis) {
      (globalThis as any).gtag('event', 'bar_details_viewed', {
        bar_id: barId,
        bar_name: bar.name,
        bar_city: bar.address.city,
        response_time_ms: duration
      });
    }

    const response: BarResponse = {
      success: true,
      bar
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ API Error in /api/bars/${barId}:`, error);
    
    const errorResponse: BarResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bar'
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