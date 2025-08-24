// Location information interface
export interface Location {
  code: string;
  displayName: string;
  url: string;
}

// Origin and destination pair interface
export interface OriginAndDestinationPair {
  origin: Location;
  originCity: string;
  destination: Location;
  destinationCity: string;
}

// Segment information interface
export interface Segment {
  id: number;
  originAndDestinationPair: OriginAndDestinationPair;
}

// Ship information data interface
export interface ShipInfo {
  shipReference: string;
  shipToken: string;
  canIssueTicketChecking: boolean;
  expiryTime: string;
  duration: number;
  segments: Segment[];
}

// Cached data interface
export interface CachedData {
  data: ShipInfo;
  timestamp: number;
}

// Data manager state interface
export interface ShipInfoManagerState {
  isLoading: boolean;
  error: Error | null;
  shipInfo: ShipInfo | null;
  lastUpdated: number | null;
}

// Data manager options interface
export interface ShipInfoManagerOptions {
  cacheDuration?: number; // Cache valid duration (ms), default 30 minutes
  refreshOnLoad?: boolean; // Whether to refresh data on load, default true
}