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
