import { ShipInfo } from '../types/booking';

/**
 * 船舶信息服务类，负责从数据源获取船舶信息数据
 */
export class BookingService {
  private readonly dataSourcePath = 'booking.json';
  private readonly dataTTL = 30 * 60 * 1000; // 数据有效期30分钟
  private lastFetchedTime: number | null = null;
  private cachedResponse: ShipInfo | null = null;

  /**
   * 获取船舶信息数据
   * @param forceRefresh 是否强制刷新数据，忽略缓存
   * @returns 船舶信息数据
   */
  public async getBookings(forceRefresh: boolean = false): Promise<ShipInfo> {
    try {
      // 检查缓存是否有效
      if (this.cachedResponse && this.lastFetchedTime && !forceRefresh) {
        const now = Date.now();
        // 如果缓存未过期，则返回缓存数据
        if (now - this.lastFetchedTime < this.dataTTL) {
          console.log('Using cached ship info data');
          return this.cachedResponse;
        }
        console.log('Cached ship info data has expired, fetching new data');
      }

      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      // 在实际应用中，这里应该是一个API调用
      // 但在当前环境中，我们从本地文件读取
      const response = await this.fetchFromDataSource();
      
      // 更新缓存
      this.cachedResponse = response;
      this.lastFetchedTime = Date.now();
      
      return response;
    } catch (error) {
      console.error('Error fetching ship info:', error);
      // 如果有缓存数据，即使过期也返回
      if (this.cachedResponse) {
        console.warn('Returning expired cached data due to error');
        return this.cachedResponse;
      }
      throw error;
    }
  }

  /**
   * 从数据源获取数据
   * 实际项目中，这里会是一个HTTP请求
   * 在当前环境中，我们使用mock数据
   */
  private async fetchFromDataSource(): Promise<ShipInfo> {
    try {
      // 在Expo环境中，我们可以使用Asset或fs来读取文件
      // 但在当前环境中，我们使用mock数据
      
      // 模拟从文件读取数据
      // 注意：在实际Expo项目中，你需要使用正确的方式加载本地文件
      const mockData = await this.loadMockData();
      return mockData;
    } catch (error) {
      console.error('Error fetching data from source:', error);
      throw new Error('Failed to fetch ship info data from source');
    }
  }

  /**
   * 加载mock数据
   * 实际项目中会被API调用替代
   */
  private async loadMockData(): Promise<ShipInfo> {
    // 由于我们不能直接读取本地文件（在某些环境中有限制），
    // 这里直接使用与booking.json相同的内容作为mock数据
    return {
      shipReference: "ABCDEF",
      shipToken: "AAAABBBCCCCDDD",
      canIssueTicketChecking: false,
      expiryTime: "1722409261",
      duration: 2430,
      segments: [
        {
          id: 1,
          originAndDestinationPair: {
            destination: {
              code: "BBB",
              displayName: "BBB DisplayName",
              url: "www.ship.com"
            },
            destinationCity: "AAA",
            origin: {
              code: "AAA",
              displayName: "AAA DisplayName",
              url: "www.ship.com"
            },
            originCity: "BBB"
          }
        },
        {
          id: 2,
          originAndDestinationPair: {
            destination: {
              code: "CCC",
              displayName: "CCC DisplayName",
              url: "www.ship.com"
            },
            destinationCity: "CCC",
            origin: {
              code: "BBB",
              displayName: "BBB DisplayName",
              url: "www.ship.com"
            },
            originCity: "BBB"
          }
        }
      ]
    };
  }

  /**
   * 检查数据是否过期
   * @param timestamp 数据时间戳
   * @returns 是否过期
   */
  public isDataExpired(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp >= this.dataTTL;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cachedResponse = null;
    this.lastFetchedTime = null;
    console.log('Ship info service cache cleared');
  }
}