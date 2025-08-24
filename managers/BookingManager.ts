import { ShipInfo, ShipInfoManagerState, ShipInfoManagerOptions } from '../types/booking';
import { BookingService } from '../services/BookingService';
import { BookingCache } from '../cache/BookingCache';

/**
 * 船舶信息数据管理器，整合Service层和Cache层，提供统一的数据访问接口
 */
export class BookingManager {
  private readonly bookingService: BookingService;
  private readonly bookingCache: BookingCache;
  private readonly defaultCacheDuration = 30 * 60 * 1000; // 默认缓存时长30分钟
  private readonly refreshOnLoad: boolean;
  private cacheDuration: number;

  // 状态管理
  private state: ShipInfoManagerState = {
    isLoading: false,
    error: null,
    shipInfo: null,
    lastUpdated: null
  };

  // 回调函数列表
  private onStateChangeCallbacks: ((state: ShipInfoManagerState) => void)[] = [];

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options?: ShipInfoManagerOptions) {
    this.bookingService = new BookingService();
    this.bookingCache = new BookingCache();
    this.refreshOnLoad = options?.refreshOnLoad ?? true;
    this.cacheDuration = options?.cacheDuration ?? this.defaultCacheDuration;
  }

  /**
   * 获取当前状态
   */
  public getState(): ShipInfoManagerState {
    return { ...this.state };
  }

  /**
   * 注册状态变化回调
   * @param callback 状态变化时的回调函数
   * @returns 取消注册的函数
   */
  public onStateChange(callback: (state: ShipInfoManagerState) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    
    // 立即调用一次回调，传递当前状态
    callback(this.getState());
    
    // 返回取消注册的函数
    return () => {
      const index = this.onStateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 更新状态并通知所有回调
   */
  private setState(newState: Partial<ShipInfoManagerState>): void {
    this.state = { ...this.state, ...newState };
    this.onStateChangeCallbacks.forEach(callback => callback(this.getState()));
  }

  /**
   * 加载船舶信息数据
   * 优先从缓存加载，根据配置决定是否刷新
   */
  public async loadBookings(): Promise<ShipInfo> {
    try {
      this.setState({ isLoading: true, error: null });
      
      // 1. 尝试从缓存加载数据
      let cachedShipInfo = await this.bookingCache.getFromCache();
      
      // 2. 如果缓存有数据且不需要强制刷新，则使用缓存数据
      if (cachedShipInfo && !this.refreshOnLoad) {
        this.setState({
          shipInfo: cachedShipInfo,
          isLoading: false,
          lastUpdated: Date.now()
        });
        return cachedShipInfo;
      }
      
      // 3. 从服务获取新数据
      const newShipInfo = await this.bookingService.getBookings(this.refreshOnLoad);
      
      // 4. 更新缓存
      await this.bookingCache.saveToCache(newShipInfo);
      
      // 5. 更新状态
      this.setState({
        shipInfo: newShipInfo,
        isLoading: false,
        lastUpdated: Date.now()
      });
      
      return newShipInfo;
    } catch (error) {
      console.error('Error loading ship info:', error);
      
      // 如果加载失败但有缓存数据，使用缓存数据
      if (!this.state.shipInfo) {
        try {
          const fallbackCache = await this.bookingCache.getFromCache(true); // 忽略过期检查
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
      
      // 更新错误状态
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to load ship info')
      });
      
      throw error;
    }
  }

  /**
   * 强制刷新船舶信息数据
   */
  public async refreshBookings(): Promise<ShipInfo> {
    try {
      this.setState({ isLoading: true, error: null });
      
      // 清除服务层内存缓存
      this.bookingService.clearCache();
      
      // 从服务获取新数据
      const newShipInfo = await this.bookingService.getBookings(true);
      
      // 更新缓存
      await this.bookingCache.saveToCache(newShipInfo);
      
      // 更新状态
      this.setState({
        shipInfo: newShipInfo,
        isLoading: false,
        lastUpdated: Date.now()
      });
      
      return newShipInfo;
    } catch (error) {
      console.error('Error refreshing ship info:', error);
      
      // 更新错误状态
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to refresh ship info')
      });
      
      throw error;
    }
  }

  /**
   * 清除所有缓存
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
   * 获取缓存是否有效
   */
  public async isCacheValid(): Promise<boolean> {
    const metadata = await this.bookingCache.getCacheMetadata();
    if (!metadata) {
      return false;
    }
    return !this.bookingCache.isCacheExpired(metadata.timestamp);
  }
}