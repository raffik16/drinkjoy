# Smart Polling System for Google Sheets Integration

This document describes the new smart polling system that replaces the broken webhook/in-memory cache system.

## Overview

The smart polling system provides a robust, production-ready solution for syncing drink data from Google Sheets to a database-backed cache. It features automatic change detection, error handling, retry logic, and comprehensive monitoring.

## Architecture

### Components

1. **Database Cache** (`lib/database-cache.ts`)
   - Stores drink data in Supabase tables
   - Provides fast access to cached drinks
   - Handles data persistence across server restarts

2. **Polling Service** (`lib/sheets-polling-service.ts`)
   - Polls Google Sheets every 60 seconds
   - Detects changes and only syncs when needed
   - Includes retry logic and error handling

3. **Drink Data Service** (`lib/drinkDataService.server.ts`)
   - Updated to use database cache instead of memory
   - Provides fallback to direct Google Sheets fetch
   - Integrates with polling service

4. **Startup System** (`lib/startup.ts`)
   - Initializes polling service on app startup
   - Handles graceful shutdown
   - Auto-initializes in production

## Database Schema

Run this SQL in your Supabase SQL editor to create the required tables:

```sql
-- See schema/drink-cache-tables.sql for complete schema
```

The system creates two main tables:
- `drink_cache`: Stores cached drink data
- `sheets_metadata`: Tracks sync status and metadata

## Configuration

### Environment Variables

```env
# Required
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Sheets Authentication (choose one)
# Option 1: API Key
GOGOLE_SHEETS_API_KEY=your_api_key

# Option 2: Service Account
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional
ENABLE_SHEETS_POLLING=true  # Enable in development
AUTO_INIT_SERVICES=true     # Auto-initialize services
```

### Polling Configuration

The polling service can be configured programmatically:

```typescript
import { sheetsPollingService } from '@/lib/sheets-polling-service';

// Update configuration
sheetsPollingService.updateConfig({
  intervalMs: 120000, // 2 minutes
  maxRetries: 5,
  retryDelayMs: 10000
});
```

## API Endpoints

### Sync Status
- `GET /api/admin/sync-status` - Get current sync status and cache stats
- `POST /api/admin/sync-status` - Trigger manual sync

### Monitoring
- `GET /api/admin/monitoring` - Comprehensive monitoring data with health scores and alerts

### Cache Management
- `POST /api/admin/clear-cache` - Clear database cache

## Features

### Smart Change Detection
- Only syncs when changes are detected
- Avoids unnecessary API calls
- Reduces load on Google Sheets API

### Error Handling
- Automatic retry with exponential backoff
- Graceful degradation on API failures
- Fallback to direct Google Sheets fetch

### Production Ready
- Works with server restarts and multiple instances
- Database-backed persistence
- Comprehensive error logging

### Monitoring & Alerts
- Health score calculation (0-100)
- Automatic alert generation
- System metrics and diagnostics

## Usage

### Initialization
The system auto-initializes in production. For development:

```typescript
import { initializeApp } from '@/lib/startup';
initializeApp();
```

### Manual Operations
```typescript
import { drinkDataService } from '@/lib/drinkDataService.server';

// Trigger manual sync
const result = await drinkDataService.performManualSync();

// Get cache stats
const stats = await drinkDataService.getCacheStats();

// Clear cache
await drinkDataService.clearCache();
```

### Monitoring Health
```bash
# Check sync status
curl /api/admin/sync-status

# Get comprehensive monitoring data
curl /api/admin/monitoring

# Trigger manual sync
curl -X POST /api/admin/sync-status
```

## Health Monitoring

The system provides a health score (0-100) based on:
- Polling service status (30 points)
- Cache health (30 points)
- Sheets sync status (25 points)
- Configuration completeness (15 points)

### Health Levels
- **90-100**: Excellent - All systems operational
- **80-89**: Good - Minor issues or warnings
- **60-79**: Warning - Some functionality degraded
- **0-59**: Critical - Major issues requiring attention

### Alert Levels
- **Info**: Informational messages
- **Warning**: Issues that should be addressed
- **Error**: Critical problems requiring immediate attention

## Troubleshooting

### Common Issues

1. **Polling service not starting**
   - Check environment variables
   - Verify Google Sheets authentication
   - Check server logs for initialization errors

2. **Cache not updating**
   - Verify polling service is running: `GET /api/admin/sync-status`
   - Check for sync errors in sheets metadata
   - Try manual sync: `POST /api/admin/sync-status`

3. **Empty cache after restart**
   - This is expected - the system will sync on first request
   - Check database tables exist: `drink_cache` and `sheets_metadata`
   - Verify Supabase connection

4. **High error rate**
   - Check Google Sheets API quotas
   - Verify spreadsheet permissions
   - Review authentication credentials

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## Migration from Old System

The new system replaces:
- ❌ `lib/cache.ts` (in-memory cache)
- ❌ `/api/admin/sheets-sync/route.ts` (webhook endpoint)

With:
- ✅ `lib/database-cache.ts` (database cache)
- ✅ `lib/sheets-polling-service.ts` (smart polling)
- ✅ Comprehensive monitoring and error handling

## Performance

### Efficiency
- Only fetches data when changes detected
- Database-backed caching for fast access
- Minimal Google Sheets API usage

### Scalability
- Works with multiple server instances
- Handles server restarts gracefully
- Database persistence prevents data loss

### Reliability
- Automatic retry logic
- Graceful error handling
- Fallback mechanisms

## Security

- Uses Supabase Row Level Security (RLS)
- Secure credential handling
- Optional webhook authentication
- Input validation and sanitization