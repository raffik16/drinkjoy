import { NextRequest, NextResponse } from 'next/server';
import { barLocationService } from '@/lib/barLocationService';
import type { NearbyBarsRequest, NearbyBarsResponse } from '@/app/types/bars';
import { isValidCoordinates } from '@/lib/locationUtils';

export async function POST(request: NextRequest) {
  try {
    const body: NearbyBarsRequest = await request.json();
    
    const {
      latitude,
      longitude,
      max_distance_miles = 15, // Changed from 25km to 15 miles
      limit = 10,
      active_only = true
    } = body;

    // Validate required fields
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      const errorResponse: NearbyBarsResponse = {
        success: false,
        error: 'Invalid coordinates: latitude and longitude must be numbers'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate coordinates
    const userLocation = { latitude, longitude };
    if (!isValidCoordinates(userLocation)) {
      const errorResponse: NearbyBarsResponse = {
        success: false,
        error: 'Invalid coordinates: must be valid latitude (-90 to 90) and longitude (-180 to 180)'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate other parameters  
    if (max_distance_miles <= 0 || max_distance_miles > 300) { // ~500km = 300 miles
      const errorResponse: NearbyBarsResponse = {
        success: false,
        error: 'Invalid max_distance_miles: must be between 0 and 300'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (limit <= 0 || limit > 100) {
      const errorResponse: NearbyBarsResponse = {
        success: false,
        error: 'Invalid limit: must be between 1 and 100'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log(`📍 [API] Finding bars near ${latitude}, ${longitude} (${max_distance_miles} miles, limit: ${limit})`);

    const startTime = Date.now();
    
    const nearbyBars = await barLocationService.findNearbyBars({
      latitude,
      longitude,
      max_distance_miles,
      limit,
      active_only
    });

    const duration = Date.now() - startTime;
    console.log(`✅ API: Found ${nearbyBars.length} nearby bars in ${duration}ms`);

    // Track analytics if available
    if (typeof globalThis !== 'undefined' && 'gtag' in globalThis) {
      (globalThis as any).gtag('event', 'nearby_bars_search', {
        user_latitude: latitude,
        user_longitude: longitude,
        max_distance_miles,
        bars_found: nearbyBars.length,
        response_time_ms: duration
      });
    }

    const response: NearbyBarsResponse = {
      success: true,
      bars: nearbyBars,
      count: nearbyBars.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API Error in /api/bars/nearby:', error);
    
    const errorResponse: NearbyBarsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find nearby bars'
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