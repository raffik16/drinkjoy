import 'server-only';
import { drinkDataService } from './drinkDataService.server';

let isInitialized = false;

/**
 * Initialize application services on startup
 * This should be called once when the application starts
 */
export function initializeApp(): void {
  if (isInitialized) {
    console.log('📊 App already initialized, skipping...');
    return;
  }

  console.log('🚀 Initializing Drinkjoy application services...');

  try {
    // Initialize the polling service
    console.log('📊 Starting Google Sheets polling service...');
    drinkDataService.initializePolling();

    isInitialized = true;
    console.log('✅ Application services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application services:', error);
    // Don't throw here - app should still work with fallback behavior
  }
}

/**
 * Graceful shutdown handler
 */
export function shutdownApp(): void {
  if (!isInitialized) {
    return;
  }

  console.log('🛑 Shutting down application services...');

  try {
    // Stop the polling service
    drinkDataService.stopPolling();
    
    isInitialized = false;
    console.log('✅ Application services shut down successfully');
  } catch (error) {
    console.error('❌ Error during application shutdown:', error);
  }
}

/**
 * Check if app is initialized
 */
export function isAppInitialized(): boolean {
  return isInitialized;
}

// Auto-initialize in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.AUTO_INIT_SERVICES === 'true') {
  initializeApp();
}

// Handle graceful shutdown - only in Node.js runtime, not Edge Runtime
// Skip signal handlers in development and Edge Runtime environments
if (typeof process !== 'undefined' && 
    typeof process.on === 'function' && 
    process.env.NODE_ENV === 'production' &&
    typeof globalThis.EdgeRuntime === 'undefined') {
  try {
    process.on('SIGTERM', shutdownApp);
    process.on('SIGINT', shutdownApp);
  } catch {
    // Ignore if not supported in current runtime
    console.log('⚠️ Process signals not supported in current runtime');
  }
}