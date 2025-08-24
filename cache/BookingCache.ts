import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShipInfo, CachedData } from '../types/booking';

/**
 * Ship information data cache class responsible for local persistent storage of ship information data
 */
export class BookingCache {
  private readonly CACHE_KEY = 'ship_info_data_cache';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // Cache valid duration 30 minutes

  /**
   * Store data in cache
   * @param shipInfo Ship information data
   */
  public async saveToCache(shipInfo: ShipInfo): Promise<void> {
    try {
      const cachedData: CachedData = {
        data: shipInfo,
        timestamp: Date.now()
      };

      const jsonString = JSON.stringify(cachedData);
      await AsyncStorage.setItem(this.CACHE_KEY, jsonString);
      console.log('Ship info data saved to cache');
    } catch (error) {
      console.error('Error saving ship info data to cache:', error);
      throw new Error('Failed to save ship info data to cache');
    }
  }

  /**
   * Read data from cache
   * @param ignoreExpiry Whether to ignore expiration check
   * @returns Cached ship information data or null
   */
  public async getFromCache(ignoreExpiry: boolean = false): Promise<ShipInfo | null> {
    try {
      const jsonString = await AsyncStorage.getItem(this.CACHE_KEY);

      if (!jsonString) {
        console.log('No ship info data in cache');
        return null;
      }

      const cachedData: CachedData = JSON.parse(jsonString);
      const { data, timestamp } = cachedData;

      // Check if cache has expired
      if (!ignoreExpiry && this.isCacheExpired(timestamp)) {
        console.log('Ship info cache has expired');
        // Clear cache after expiration
        await this.clearCache();
        return null;
      }

      console.log('Ship info data retrieved from cache');
      return data;
    } catch (error) {
      console.error('Error retrieving ship info data from cache:', error);
      // In case of error, try to clear possibly corrupted cache
      try {
        await this.clearCache();
      } catch (clearError) {
        console.error('Error clearing corrupted cache:', clearError);
      }
      return null;
    }
  }

  /**
   * Check if cache has expired
   * @param timestamp Cache timestamp
   * @returns Whether it has expired
   */
  public isCacheExpired(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp >= this.CACHE_DURATION;
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      console.log('Ship info cache cleared');
    } catch (error) {
      console.error('Error clearing ship info cache:', error);
      throw new Error('Failed to clear ship info cache');
    }
  }

  /**
   * Get cache metadata
   * @returns Cache metadata including timestamp
   */
  public async getCacheMetadata(): Promise<{ timestamp: number } | null> {
    try {
      const jsonString = await AsyncStorage.getItem(this.CACHE_KEY);

      if (!jsonString) {
        return null;
      }

      const cachedData: CachedData = JSON.parse(jsonString);
      return {
        timestamp: cachedData.timestamp
      };
    } catch (error) {
      console.error('Error retrieving cache metadata:', error);
      return null;
    }
  }

  /**
   * Update cache validity period
   * This method can be used to extend cache lifetime when cache is about to expire but data is still valid
   */
  public async extendCacheLifetime(): Promise<boolean> {
    try {
      const shipInfo = await this.getFromCache(true); // Ignore expiration check

      if (!shipInfo) {
        return false;
      }

      await this.saveToCache(shipInfo);
      return true;
    } catch (error) {
      console.error('Error extending cache lifetime:', error);
      return false;
    }
  }
}