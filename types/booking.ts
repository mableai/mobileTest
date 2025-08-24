// 位置信息接口
export interface Location {
  code: string;
  displayName: string;
  url: string;
}

// 出发地和目的地配对接口
export interface OriginAndDestinationPair {
  origin: Location;
  originCity: string;
  destination: Location;
  destinationCity: string;
}

// 航段信息接口
export interface Segment {
  id: number;
  originAndDestinationPair: OriginAndDestinationPair;
}

// 船舶信息数据接口
export interface ShipInfo {
  shipReference: string;
  shipToken: string;
  canIssueTicketChecking: boolean;
  expiryTime: string;
  duration: number;
  segments: Segment[];
}

// 缓存数据接口
export interface CachedData {
  data: ShipInfo;
  timestamp: number;
}

// 数据管理器状态接口
export interface ShipInfoManagerState {
  isLoading: boolean;
  error: Error | null;
  shipInfo: ShipInfo | null;
  lastUpdated: number | null;
}

// 数据管理器选项接口
export interface ShipInfoManagerOptions {
  cacheDuration?: number; // 缓存有效时长（毫秒），默认30分钟
  refreshOnLoad?: boolean; // 加载时是否刷新数据，默认true
}