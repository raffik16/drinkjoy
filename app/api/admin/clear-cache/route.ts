import { NextRequest, NextResponse } from 'next/server';
import { drinkCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication (optional)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.SHEETS_WEBHOOK_SECRET;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Clear the cache
    drinkCache.clear();
    
    console.log('🗑️ Drinks cache cleared manually');
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'clear-cache',
    timestamp: new Date().toISOString()
  });
}