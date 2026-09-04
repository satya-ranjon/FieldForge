import type { MinorUnits } from '../money';

/**
 * Bid submission request. The bidding technician comes from the verified access
 * token, never from the body — see CreateWorkOrderDto.
 */
export interface SubmitBidDto {
  workOrderId: string;
  bidAmountMinor: MinorUnits;
  estimatedArrivalMinutes?: number;
  counterNote?: string;
}

export interface NearbyTechnicianDto {
  techId: string;
  fullName: string;
  rating: number;
  completedJobsCount: number;
  distanceMiles: number;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  certifications: string[];
}

export interface UpdateTechnicianLocationDto {
  latitude: number;
  longitude: number;
}

export interface NearbyTechniciansQueryDto {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
}

export interface AutoRouteDto {
  workOrderId: string;
  maxRadiusMiles?: number;
}

export interface BidDetailsDto {
  id: string;
  workOrderId: string;
  technicianId: string;
  bidAmountMinor: MinorUnits;
  counterNote?: string | null;
  bidStatus: string;
  createdAt: string;
}
