import { ShipInfo } from '../types/booking';

/**
 * Ship information service class responsible for retrieving ship information data from data sources
 */
export class BookingService {
  private readonly dataSourcePath = 'booking.json';
  private readonly dataTTL = 30 * 60 * 1000; // Data validity period 30 minutes
  private lastFetchedTime: number | null = null;
  private cachedResponse: ShipInfo | null = null;

  /**
   * Get ship information data
   * @param forceRefresh Whether to force refresh data, ignoring cache
   * @returns Ship information data
   */
  public async getBookings(forceRefresh: boolean = false): Promise<ShipInfo> {
    try {
      // Check if cache is valid
      if (this.cachedResponse && this.lastFetchedTime && !forceRefresh) {
        const now = Date.now();
        // If cache hasn't expired, return cached data
        if (now - this.lastFetchedTime < this.dataTTL) {
          console.log('Using cached ship info data');
          return this.cachedResponse;
        }
        console.log('Cached ship info data has expired, fetching new data');
      }

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // In a real application, this would be an API call
      // But in the current environment, we read from local file
      const response = await this.fetchFromDataSource();

      // Update cache
      this.cachedResponse = response;
      this.lastFetchedTime = Date.now();

      return response;
    } catch (error) {
      console.error('Error fetching ship info:', error);
      // If there's cached data, return it even if expired
      if (this.cachedResponse) {
        console.warn('Returning expired cached data due to error');
        return this.cachedResponse;
      }
      throw error;
    }
  }

  /**
   * Fetch data from data source
   * In real projects, this would be an HTTP request
   * In the current environment, we use mock data
   */
  private async fetchFromDataSource(): Promise<ShipInfo> {
    try {
      // In Expo environment, we can use Asset or fs to read files
      // But in the current environment, we use mock data

      // Simulate reading data from file
      // Note: In a real Expo project, you need to use the correct way to load local files
      const mockData = await this.loadMockData();
      return mockData;
    } catch (error) {
      console.error('Error fetching data from source:', error);
      throw new Error('Failed to fetch ship info data from source');
    }
  }

  /**
   * Load mock data
   * Will be replaced by API calls in real projects
   */
  private async loadMockData(): Promise<ShipInfo> {
    // Since we can't directly read local files (restrictions in some environments),
    // we use the same content as booking.json here as mock data
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
   * Check if data has expired
   * @param timestamp Data timestamp
   * @returns Whether it has expired
   */
  public isDataExpired(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp >= this.dataTTL;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cachedResponse = null;
    this.lastFetchedTime = null;
    console.log('Ship info service cache cleared');
  }
}