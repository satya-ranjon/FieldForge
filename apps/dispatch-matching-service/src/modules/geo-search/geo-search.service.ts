import { Injectable } from '@nestjs/common';
import type { NearbyTechnicianDto } from '@fieldforge/contracts';

@Injectable()
export class GeoSearchService {
  async updateTechnicianLocation(
    techId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    // In production: Redis GEOADD tech:locations longitude latitude techId
    console.log(`[Redis GEOADD] tech:locations ${longitude} ${latitude} ${techId}`);
  }

  async findNearbyTechnicians(
    latitude: number,
    longitude: number,
    radiusMiles = 25
  ): Promise<NearbyTechnicianDto[]> {
    void radiusMiles; // Redis GEOSEARCH is intentionally not implemented in the scaffold.
    // In production: Redis GEOSEARCH tech:locations FROMLONLAT lng lat BYRADIUS radius mi WITHDIST WITHCOORD
    return [
      {
        techId: 't0000000-0000-0000-0000-000000000001',
        fullName: 'Alex Rivas (CCNA / Fiber)',
        rating: 4.95,
        completedJobsCount: 142,
        distanceMiles: 3.2,
        latitude: latitude + 0.02,
        longitude: longitude - 0.01,
        isAvailable: true,
        certifications: ['Cisco CCNA', 'CompTIA Network+', 'Fiber Optic Level 2']
      },
      {
        techId: 't0000000-0000-0000-0000-000000000002',
        fullName: 'Jordan Lee (POS / CCTV Tier 2)',
        rating: 4.88,
        completedJobsCount: 98,
        distanceMiles: 5.7,
        latitude: latitude - 0.04,
        longitude: longitude + 0.03,
        isAvailable: true,
        certifications: ['Verifone Certified', 'OSHA 10']
      }
    ];
  }
}
