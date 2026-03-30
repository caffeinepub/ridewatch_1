// Local type definitions for RideWatch
// Backend calls use these types with graceful fallback to demo data

export interface Bus {
  id: string;
  name: string;
  routeId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  isActive: boolean;
  lastUpdate: bigint;
  driver: string;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export interface Route {
  id: string;
  name: string;
  stopIds: string[];
  color: string;
}

export interface Feedback {
  id: string;
  stopId: string;
  rating: bigint;
  comment: string;
  submittedBy: string;
  timestamp: bigint;
}

export interface CrowdReport {
  id: string;
  stopId: string;
  reportType: CrowdReportType;
  reportedBy: string;
  isVerified: boolean;
  timestamp: bigint;
  busId: string;
}

export enum CrowdReportType {
  arrival = "arrival",
  departure = "departure",
}

export interface RideWatchActor {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  addBus(
    name: string,
    routeId: string,
    lat: number,
    lng: number,
  ): Promise<string>;
  getAllBuses(): Promise<Bus[]>;
  getStops(): Promise<Stop[]>;
  getRoutes(): Promise<Route[]>;
  isCallerAdmin(): Promise<boolean>;
  getRecentCrowdReports(): Promise<CrowdReport[]>;
  getCrowdReportsByStop(stopId: string): Promise<CrowdReport[]>;
  getAverageRating(stopId: string): Promise<number>;
  submitCrowdReport(
    stopId: string,
    reportType: CrowdReportType,
    busId: string,
  ): Promise<string>;
  submitFeedback(
    stopId: string,
    rating: bigint,
    comment: string,
  ): Promise<string>;
  submitAnonymousGPS(lat: number, lng: number): Promise<string>;
  setBusActive(busId: string, isActive: boolean): Promise<boolean>;
  verifyCrowdReport(reportId: string): Promise<boolean>;
  getActiveShuttleCount(): Promise<bigint>;
  getTotalCrowdReports(): Promise<bigint>;
  getTotalFeedback(): Promise<bigint>;
}
