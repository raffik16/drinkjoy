import { NextRequest, NextResponse } from 'next/server';
import { drinkDataService } from '@/lib/drinkDataService.server';
import { databaseCache } from '@/lib/database-cache';

/**
 * Get sync status and cache statistics
 */
export async function GET() {
  try {
    // Get polling service status
    const pollingStatus = drinkDataService.getPollingStatus();
    
    // Get cache statistics
    const cacheStats = await drinkDataService.getCacheStats();
    
    // Get sheets metadata if available
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    let sheetsMetadata = null;
    
    if (spreadsheetId) {
      sheetsMetadata = await databaseCache.getSheetsMetadata(spreadsheetId);
    }

    return NextResponse.json({
      success: true,
      data: {
        polling: pollingStatus,
        cache: cacheStats,
        sheets: sheetsMetadata,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    
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

/**
 * Trigger manual sync
 */
export async function POST() {
  try {
    console.log('📊 Manual sync triggered via API');
    
    const result = await drinkDataService.performManualSync();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          message: result.message
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error performing manual sync:', error);
    
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