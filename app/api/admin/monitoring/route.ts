import { NextRequest, NextResponse } from 'next/server';
import { drinkDataService } from '@/lib/drinkDataService.server';
import { databaseCache } from '@/lib/database-cache';

/**
 * Get comprehensive monitoring data for the polling system
 */
export async function GET(request: NextRequest) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // Get polling service status
    const pollingStatus = drinkDataService.getPollingStatus();
    
    // Get cache statistics
    const cacheStats = await drinkDataService.getCacheStats();
    
    // Get sheets metadata
    let sheetsMetadata = null;
    if (spreadsheetId) {
      sheetsMetadata = await databaseCache.getSheetsMetadata(spreadsheetId);
    }
    
    // Check cache health
    const isCacheHealthy = await databaseCache.isCacheHealthy(30); // 30 minutes
    
    // Calculate health score
    const healthScore = calculateHealthScore({
      pollingStatus,
      cacheStats,
      sheetsMetadata,
      isCacheHealthy
    });

    // Generate alerts if any issues detected
    const alerts = generateAlerts({
      pollingStatus,
      cacheStats,
      sheetsMetadata,
      isCacheHealthy
    });

    const monitoringData = {
      timestamp: new Date().toISOString(),
      health: {
        score: healthScore,
        status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
        isCacheHealthy
      },
      polling: {
        ...pollingStatus,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasSpreadsheetId: !!spreadsheetId,
          hasApiKey: !!process.env.GOGOLE_SHEETS_API_KEY,
          hasServiceAccount: !!(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY),
          autoInitEnabled: process.env.AUTO_INIT_SERVICES === 'true'
        }
      },
      cache: cacheStats,
      sheets: sheetsMetadata,
      alerts,
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    return NextResponse.json({
      success: true,
      data: monitoringData
    });
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore({
  pollingStatus,
  cacheStats,
  sheetsMetadata,
  isCacheHealthy
}: {
  pollingStatus: any;
  cacheStats: any;
  sheetsMetadata: any;
  isCacheHealthy: boolean;
}): number {
  let score = 0;
  
  // Polling service health (30 points)
  if (pollingStatus.isRunning) score += 15;
  if (!pollingStatus.isPolling) score += 10; // Not currently stuck in polling
  if (pollingStatus.consecutiveErrors < 3) score += 5;
  
  // Cache health (30 points)
  if (isCacheHealthy) score += 15;
  if (cacheStats.totalDrinks > 0) score += 10;
  if (Object.keys(cacheStats.drinksByCategory).length >= 3) score += 5;
  
  // Sheets sync health (25 points)
  if (sheetsMetadata) {
    if (sheetsMetadata.sync_status === 'success') score += 15;
    else if (sheetsMetadata.sync_status === 'syncing') score += 10;
    else if (sheetsMetadata.sync_status === 'error') score += 0;
    
    const lastSync = new Date(sheetsMetadata.last_sync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync < 2) score += 10;
    else if (hoursSinceSync < 24) score += 5;
  }
  
  // Configuration health (15 points)
  if (process.env.GOOGLE_SHEETS_SPREADSHEET_ID) score += 5;
  if (process.env.GOGOLE_SHEETS_API_KEY || 
      (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY)) {
    score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * Generate alerts based on system status
 */
function generateAlerts({
  pollingStatus,
  cacheStats,
  sheetsMetadata,
  isCacheHealthy
}: {
  pollingStatus: any;
  cacheStats: any;
  sheetsMetadata: any;
  isCacheHealthy: boolean;
}): Array<{ level: 'info' | 'warning' | 'error'; message: string; timestamp: string }> {
  const alerts = [];
  const now = new Date().toISOString();
  
  // Polling alerts
  if (!pollingStatus.isRunning) {
    alerts.push({
      level: 'error' as const,
      message: 'Polling service is not running',
      timestamp: now
    });
  }
  
  if (pollingStatus.consecutiveErrors >= 3) {
    alerts.push({
      level: 'warning' as const,
      message: `High error rate: ${pollingStatus.consecutiveErrors} consecutive errors`,
      timestamp: now
    });
  }
  
  if (pollingStatus.consecutiveErrors >= 5) {
    alerts.push({
      level: 'error' as const,
      message: 'Polling service stopped due to too many errors',
      timestamp: now
    });
  }
  
  // Cache alerts
  if (!isCacheHealthy) {
    alerts.push({
      level: 'warning' as const,
      message: 'Cache is stale or empty',
      timestamp: now
    });
  }
  
  if (cacheStats.totalDrinks === 0) {
    alerts.push({
      level: 'error' as const,
      message: 'No drinks in cache',
      timestamp: now
    });
  }
  
  // Sheets sync alerts
  if (sheetsMetadata) {
    if (sheetsMetadata.sync_status === 'error') {
      alerts.push({
        level: 'error' as const,
        message: `Sheets sync error: ${sheetsMetadata.error_message}`,
        timestamp: now
      });
    }
    
    const lastSync = new Date(sheetsMetadata.last_sync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync > 24) {
      alerts.push({
        level: 'warning' as const,
        message: `No successful sync in ${Math.round(hoursSinceSync)} hours`,
        timestamp: now
      });
    }
  } else {
    alerts.push({
      level: 'info' as const,
      message: 'No sheets metadata available',
      timestamp: now
    });
  }
  
  // Configuration alerts
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    alerts.push({
      level: 'warning' as const,
      message: 'Google Sheets spreadsheet ID not configured',
      timestamp: now
    });
  }
  
  if (!process.env.GOGOLE_SHEETS_API_KEY && 
      !(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY)) {
    alerts.push({
      level: 'error' as const,
      message: 'Google Sheets authentication not configured',
      timestamp: now
    });
  }
  
  return alerts;
}