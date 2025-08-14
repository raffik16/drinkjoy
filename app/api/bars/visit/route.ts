import { NextRequest, NextResponse } from 'next/server';
import { barDataService } from '@/lib/barDataService.server';

interface VisitRequest {
  bar_id: string;
  user_session_id?: string;
  source?: 'geolocation' | 'manual' | 'recommendation';
  user_location?: {
    latitude: number;
    longitude: number;
  };
}

interface VisitResponse {
  success: boolean;
  message?: string;
  bar?: {
    id: string;
    name: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VisitRequest = await request.json();
    
    const {
      bar_id,
      user_session_id,
      source = 'manual',
      user_location
    } = body;

    // Validate required fields
    if (!bar_id) {
      const errorResponse: VisitResponse = {
        success: false,
        error: 'Bar ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log(`📍 API: Recording bar visit for ${bar_id} (source: ${source})`);

    // Verify bar exists
    const bar = await barDataService.getBarById(bar_id);
    
    if (!bar) {
      const errorResponse: VisitResponse = {
        success: false,
        error: 'Bar not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // In a real application, you would store this visit data
    // For now, we'll just log and track analytics
    
    console.log(`✅ API: Recorded visit to ${bar.name}`);

    // Track analytics if available
    if (typeof globalThis !== 'undefined' && 'gtag' in globalThis) {
      (globalThis as any).gtag('event', 'bar_visit', {
        bar_id: bar_id,
        bar_name: bar.name,
        bar_city: bar.address.city,
        selection_source: source,
        user_session_id: user_session_id,
        has_user_location: !!user_location
      });
    }

    const response: VisitResponse = {
      success: true,
      message: 'Visit recorded successfully',
      bar: {
        id: bar.id,
        name: bar.name
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API Error in /api/bars/visit:', error);
    
    const errorResponse: VisitResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record visit'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}