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
   */
  private setState(newState: Partial<ShipInfoManagerState>): void {
    this.state = { ...this.state, ...newState };
    this.onStateChangeCallbacks.forEach(callback => callback(this.getState()));
  }

  /**
   * Load ship information data
   * Load from cache first, decide whether to refresh based on configuration
   */
  public async loadBookings(): Promise<ShipInfo> {
    try {
      this.setState({ isLoading: true, error: null });

      // 1. Try to load data from cache
      let cachedShipInfo = await this.bookingCache.getFromCache();

      // 2. If there's cached data and no forced refresh needed, use cached data
      if (cachedShipInfo && !this.refreshOnLoad) {
        this.setState({
          shipInfo: cachedShipInfo,
          isLoading: false,
          lastUpdated: Date.now()
        });
        return cachedShipInfo;
      }

      // 3. Get new data from service
      const newShipInfo = await this.bookingService.getBookings(this.refreshOnLoad);

      // 4. Update cache
      await this.bookingCache.saveToCache(newShipInfo);

      // 5. Update state
      this.setState({
        shipInfo: newShipInfo,
        isLoading: false,
        lastUpdated: Date.now()
      });

      return newShipInfo;
    } catch (error) {
      console.error('Error loading ship info:', error);

      // If loading fails but there's cached data, use cached data
      if (!this.state.shipInfo) {
        try {
          const fallbackCache = await this.bookingCache.getFromCache(true); // Ignore expiration check
          if (fallbackCache) {
            this.setState({
              shipInfo: fallbackCache,
              isLoading: false,
              error: error instanceof Error ? error : new Error('Failed to load ship info')
            });
            return fallbackCache;
          }
        } catch (fallbackError) {
          console.error('Error loading fallback cache:', fallbackError);
        }
      }

      // Update error state
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to load ship info')
      });

      throw error;
    }
  }

  /**
   * Force refresh ship information data
   */
  public async refreshBookings(): Promise<ShipInfo> {
    try {
      this.setState({ isLoading: true, error: null });

      // Clear service layer memory cache
      this.bookingService.clearCache();

      // Get new data from service
      const newShipInfo = await this.bookingService.getBookings(true);

      // Update cache
      await this.bookingCache.saveToCache(newShipInfo);

      // Update state
      this.setState({
        shipInfo: newShipInfo,
        isLoading: false,
        lastUpdated: Date.now()
      });

      return newShipInfo;
    } catch (error) {
      console.error('Error refreshing ship info:', error);

      // Update error state
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to refresh ship info')
      });

      throw error;
    }
  }

  /**
   * Clear all cache
   */
  public async clearAllCache(): Promise<void> {
    try {
      this.bookingService.clearCache();
      await this.bookingCache.clearCache();

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
   */
  public async isCacheValid(): Promise<boolean> {
    const metadata = await this.bookingCache.getCacheMetadata();
    if (!metadata) {
      return false;
    }
    return !this.bookingCache.isCacheExpired(metadata.timestamp);
  }
}