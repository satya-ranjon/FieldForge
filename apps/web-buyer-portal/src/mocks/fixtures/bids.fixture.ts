import type { ExtendedBid } from '../../store/slices/dispatchSlice';
import { BidStatus } from '@fieldforge/contracts';

const now = 1772496000000;

export const mockBids: ExtendedBid[] = [
  {
    id: 'bid-001',
    workOrderId: 'wo-101',
    techId: 'tech-marcus-01',
    technicianName: 'Marcus Vance, CCNA',
    technicianRating: 4.98,
    technicianJobsCount: 142,
    technicianCertifications: ['Cisco CCNA', 'CompTIA A+', 'OSHA 10'],
    distanceMiles: 1.8,
    bidAmountMinor: 42_000,
    estimatedArrivalMinutes: 25,
    counterNote: 'In the area with Fluke cable certifier and 4 spare Ingenico Lane/7000 brackets.',
    status: BidStatus.PENDING,
    submittedAt: new Date(now - 1200000).toISOString()
  },
  {
    id: 'bid-002',
    workOrderId: 'wo-101',
    techId: 'tech-andre-05',
    technicianName: 'Andre Becker',
    technicianRating: 4.85,
    technicianJobsCount: 164,
    technicianCertifications: ['CompTIA A+', 'OSHA 10', 'Cat6 Structured Cabling'],
    distanceMiles: 2.3,
    bidAmountMinor: 45_000,
    estimatedArrivalMinutes: 35,
    counterNote: 'Ready with complete Cat6 termination toolkit and patch cords.',
    status: BidStatus.PENDING,
    submittedAt: new Date(now - 800000).toISOString()
  },
  {
    id: 'bid-003',
    workOrderId: 'wo-101',
    techId: 'tech-darnell-03',
    technicianName: 'Darnell Jenkins, CCNP',
    technicianRating: 4.88,
    technicianJobsCount: 215,
    technicianCertifications: ['Cisco CCNP', 'CompTIA Network+'],
    distanceMiles: 4.2,
    bidAmountMinor: 48_000,
    estimatedArrivalMinutes: 20,
    counterNote: 'Emergency priority response. Full test gear in vehicle.',
    status: BidStatus.PENDING,
    submittedAt: new Date(now - 400000).toISOString()
  }
];
