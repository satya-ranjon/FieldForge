import { BidStatus } from '../enums';

export interface SubmitBidDto {
  workOrderId: string;
  techId: string;
  proposedAmount: number;
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
