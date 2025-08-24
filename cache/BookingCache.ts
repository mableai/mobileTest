import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShipInfo, CachedData } from '../types/booking';

/**
 * 船舶信息数据缓存类，负责本地持久化存储船舶信息数据
 */
export class BookingCache {
  private readonly CACHE_KEY = 'ship_info_data_cache';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 缓存有效时长30分钟

  /**
   * 存储数据到缓存
   * @param shipInfo 船舶信息数据
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
   * 从缓存读取数据
   * @param ignoreExpiry 是否忽略过期检查
   * @returns 缓存的船舶信息数据或null
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
      
      // 检查缓存是否过期
      if (!ignoreExpiry && this.isCacheExpired(timestamp)) {
        console.log('Ship info cache has expired');
        // 过期后清除缓存
        await this.clearCache();
        return null;
      }
      
      console.log('Ship info data retrieved from cache');
      return data;
    } catch (error) {
      console.error('Error retrieving ship info data from cache:', error);
      // 在发生错误时，尝试清除可能损坏的缓存
      try {
        await this.clearCache();
      } catch (clearError) {
        console.error('Error clearing corrupted cache:', clearError);
      }
      return null;
    }
  }

  /**
   * 检查缓存是否过期
   * @param timestamp 缓存的时间戳
   * @returns 是否过期
   */
  public isCacheExpired(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp >= this.CACHE_DURATION;
  }

  /**
   * 清除缓存
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
   * 获取缓存的元数据
   * @returns 缓存的元数据，包括时间戳
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
   * 更新缓存的有效期
   * 此方法可用于在缓存即将过期但数据仍然有效的情况下延长缓存寿命
   */
  public async extendCacheLifetime(): Promise<boolean> {
    try {
      const shipInfo = await this.getFromCache(true); // 忽略过期检查
      
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