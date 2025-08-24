import { ShipInfo, ShipInfoManagerState, ShipInfoManagerOptions } from '../types/booking';
import { BookingService } from '../services/BookingService';
import { BookingCache } from '../cache/BookingCache';

/**
 * Ship information data manager that integrates Service layer and Cache layer to provide unified data access interface
 */
export class BookingManager {
  private readonly bookingService: BookingService;
  private readonly bookingCache: BookingCache;
  private readonly defaultCacheDuration = 30 * 60 * 1000; // Default cache duration 30 minutes
  private readonly refreshOnLoad: boolean;
  private cacheDuration: number;

  // State management
  private state: ShipInfoManagerState = {
    isLoading: false,
    error: null,
    shipInfo: null,
    lastUpdated: null
  };

  // Callback function list
  private onStateChangeCallbacks: ((state: ShipInfoManagerState) => void)[] = [];
  
  // Concurrent request control
  private activeRequest: Promise<ShipInfo> | null = null;

  /**
   * Constructor
   * @param options Configuration options
   */
  constructor(options?: ShipInfoManagerOptions) {
    this.bookingService = new BookingService();
    this.bookingCache = new BookingCache();
    this.refreshOnLoad = options?.refreshOnLoad ?? true;
    this.cacheDuration = options?.cacheDuration ?? this.defaultCacheDuration;
  }

  /**
   * Get current state
   */
  public getState(): ShipInfoManagerState {
    return { ...this.state };
  }

  /**
   * Register state change callback
   * @param callback Callback function when state changes
   * @returns Function to unregister
   */
  public onStateChange(callback: (state: ShipInfoManagerState) => void): () => void {
    this.onStateChangeCallbacks.push(callback);

    // Call callback immediately with current state
    callback(this.getState());

    // Return unregister function
    return () => {
      const index = this.onStateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update state and notify all callbacks
   * This is optimized to avoid unnecessary re-renders
   */
  private setState(newState: Partial<ShipInfoManagerState>): void {
    // Check if state actually changed before updating
    const hasChanged = Object.entries(newState).some(
      ([key, value]) => this.state[key as keyof ShipInfoManagerState] !== value
    );
    
    if (!hasChanged) return;
    
    this.state = { ...this.state, ...newState };
    
    // Notify all callbacks asynchronously to avoid blocking the main thread
    Promise.resolve().then(() => {
      this.onStateChangeCallbacks.forEach(callback => callback(this.getState()));
    });
  }

  /**
   * Common error handling logic
   */
  private handleError(error: unknown, operation: 'load' | 'refresh'): Error {
    const errorMessage = operation === 'load' 
      ? 'Failed to load ship info'
      : 'Failed to refresh ship info';
    
    console.error(`Error ${operation}ing ship info:`, error);
    
    this.setState({
      isLoading: false,
      error: error instanceof Error ? error : new Error(errorMessage)
    });
    
    return error instanceof Error ? error : new Error(errorMessage);
  }

  /**
   * Load ship information data
   * Optimized for concurrent requests and cache utilization
   */
  public async loadBookings(): Promise<ShipInfo> {
    // Return existing request if already in progress to prevent duplicate requests
    if (this.activeRequest) {
      return this.activeRequest;
    }

    try {
      this.setState({ isLoading: true, error: null });
      
      // Create a new request promise and store it
      this.activeRequest = this.performLoadBookings();
      const result = await this.activeRequest;
      return result;
    } finally {
      // Clear active request reference when done
      this.activeRequest = null;
    }
  }
  
  /**
   * Internal method to perform the actual booking loading
   * Separated for better error handling and concurrency control
   */
  private async performLoadBookings(): Promise<ShipInfo> {
    try {
      // Check if we can use cached data without hitting the service
      if (!this.refreshOnLoad && this.state.shipInfo) {
        // Use already loaded data if available and not forced to refresh
        this.setState({
          isLoading: false,
          lastUpdated: Date.now()
        });
        return this.state.shipInfo;
      }

      // 1. Try to load fresh data from service with its own caching
      try {
        const newShipInfo = await this.bookingService.getBookings(this.refreshOnLoad);
        
        // 2. Update persistent cache
        await this.bookingCache.saveToCache(newShipInfo);
        
        // 3. Update state
        this.setState({
          shipInfo: newShipInfo,
          isLoading: false,
          lastUpdated: Date.now()
        });
        
        return newShipInfo;
      } catch (serviceError) {
        console.warn('Service error, trying fallback cache:', serviceError);
        
        // 4. If service fails, try to get fallback data from persistent cache
        if (!this.state.shipInfo) {
          const fallbackCache = await this.bookingCache.getFromCache(true); // Ignore expiration check
          if (fallbackCache) {
            this.setState({
              shipInfo: fallbackCache,
              isLoading: false,
              error: serviceError instanceof Error ? serviceError : new Error('Failed to load fresh ship info')
            });
            return fallbackCache;
          }
        }
        
        // 5. If no fallback cache available, throw the original error
        throw serviceError;
      }
    } catch (error) {
      throw this.handleError(error, 'load');
    }
  }

  /**
   * Force refresh ship information data
   * Optimized to share logic with loadBookings
   */
  public async refreshBookings(): Promise<ShipInfo> {
    // Clear service layer memory cache
    this.bookingService.clearCache();
    
    // Force refresh by setting refreshOnLoad temporarily
    const originalRefreshOnLoad = this.refreshOnLoad;
    (this as any).refreshOnLoad = true;
    
    try {
      // Reuse loadBookings with forced refresh
      return await this.loadBookings();
    } finally {
      // Restore original setting
      (this as any).refreshOnLoad = originalRefreshOnLoad;
    }
  }

  /**
   * Clear all cache
   */
  public async clearAllCache(): Promise<void> {
    try {
      // Clear all cache layers
      this.bookingService.clearCache();
      await this.bookingCache.clearCache();
      
      // Update state to reflect cleared cache
      this.setState({
        shipInfo: null,
        lastUpdated: null
      });
      
      console.log('All ship info caches cleared');
    } catch (error) {
      console.error('Error clearing all caches:', error);
      throw error;
    }
  }

  /**
   * Check if cache is valid
   * Optimized to avoid unnecessary AsyncStorage operations
   */
  public async isCacheValid(): Promise<boolean> {
    // First check if we have recent in-memory state
    if (this.state.lastUpdated && Date.now() - this.state.lastUpdated < this.cacheDuration) {
      return true;
    }
    
    // If in-memory state is not valid, check persistent cache
    const metadata = await this.bookingCache.getCacheMetadata();
    if (!metadata) {
      return false;
    }
    
    return !this.bookingCache.isCacheExpired(metadata.timestamp);
  }
}