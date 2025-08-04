import { NextRequest, NextResponse } from 'next/server';
import { drinkDataService } from '@/lib/drinkDataService.server';

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
    
    // Clear the database cache
    const success = await drinkDataService.clearCache();
    
    if (success) {
      console.log('🗑️ Database cache cleared successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Database cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Failed to clear database cache');
    }
    
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    
    return NextResponse.json(
      { 
        success: false,
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