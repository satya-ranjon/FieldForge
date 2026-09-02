import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { NearbyTechnicianDto, SubmitBidDto } from '@fieldforge/contracts';
import { BidStatus } from '@fieldforge/contracts';

/**
 * A bid as the server reports it back. `techId` is added here rather than
 * inherited: `SubmitBidDto` deliberately omits it so a bidder cannot claim to be
 * someone else, but the response identifies the bidder.
 */
export interface ExtendedBid extends SubmitBidDto {
  id: string;
  techId: string;
  technicianName: string;
  technicianRating: number;
  technicianJobsCount: number;
  technicianCertifications: string[];
  distanceMiles: number;
  status: BidStatus;
  submittedAt: string;
}

export interface DispatchState {
  nearbyTechnicians: NearbyTechnicianDto[];
  activeBids: ExtendedBid[];
  selectedTechId: string | null;
  radarRadiusMiles: number;
  isBroadcasting: boolean;
}

// Fixed baseline timestamp for deterministic SSR hydration parity
const now = 1772496000000;

const initialTechnicians: NearbyTechnicianDto[] = [
  {
    techId: 'tech-marcus-01',
    fullName: 'Marcus Vance, CCNA',
    rating: 4.98,
    completedJobsCount: 142,
    distanceMiles: 1.8,
    latitude: 37.779,
    longitude: -122.41,
    isAvailable: true,
    certifications: ['Cisco CCNA', 'CompTIA A+', 'OSHA 10', 'Background Checked']
  },
  {
    techId: 'tech-elena-02',
    fullName: 'Elena Rostova',
    rating: 4.92,
    completedJobsCount: 98,
    distanceMiles: 3.4,
    latitude: 37.765,
    longitude: -122.42,
    isAvailable: true,
    certifications: ['Weights & Measures State Cert', 'CompTIA A+', 'Background Checked']
  },
  {
    techId: 'tech-darnell-03',
    fullName: 'Darnell Jenkins, CCNP',
    rating: 4.88,
    completedJobsCount: 215,
    distanceMiles: 4.2,
    latitude: 37.795,
    longitude: -122.398,
    isAvailable: true,
    certifications: ['Cisco CCNP', 'CompTIA Network+', 'OSHA 10']
  },
  {
    techId: 'tech-sarah-04',
    fullName: 'Sarah Lin',
    rating: 4.95,
    completedJobsCount: 76,
    distanceMiles: 5.1,
    latitude: 37.74,
    longitude: -122.44,
    isAvailable: false,
    certifications: ['IoT Specialist', 'Outdoor Display Cert', 'OSHA 10']
  },
  {
    techId: 'tech-andre-05',
    fullName: 'Andre Becker',
    rating: 4.85,
    completedJobsCount: 164,
    distanceMiles: 2.3,
    latitude: 37.77,
    longitude: -122.43,
    isAvailable: true,
    certifications: ['CompTIA A+', 'OSHA 10', 'Cat6 Structured Cabling']
  }
];

const initialBids: ExtendedBid[] = [
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

const initialState: DispatchState = {
  nearbyTechnicians: initialTechnicians,
  activeBids: initialBids,
  selectedTechId: null,
  radarRadiusMiles: 10,
  isBroadcasting: true
};

export const dispatchSlice = createSlice({
  name: 'dispatch',
  initialState,
  reducers: {
    selectTechnician: (state, action: PayloadAction<string | null>) => {
      state.selectedTechId = action.payload;
    },
    setRadarRadius: (state, action: PayloadAction<number>) => {
      state.radarRadiusMiles = action.payload;
    },
    acceptBid: (state, action: PayloadAction<{ bidId: string }>) => {
      const bid = state.activeBids.find((b) => b.id === action.payload.bidId);
      if (bid) {
        bid.status = BidStatus.ACCEPTED;
        // Mark all other bids for this work order as rejected
        state.activeBids.forEach((b) => {
          if (b.workOrderId === bid.workOrderId && b.id !== bid.id) {
            b.status = BidStatus.REJECTED;
          }
        });
      }
    },
    rejectBid: (state, action: PayloadAction<{ bidId: string }>) => {
      const bid = state.activeBids.find((b) => b.id === action.payload.bidId);
      if (bid) {
        bid.status = BidStatus.REJECTED;
      }
    },
    toggleBroadcasting: (state) => {
      state.isBroadcasting = !state.isBroadcasting;
    }
  }
});

export const { selectTechnician, setRadarRadius, acceptBid, rejectBid, toggleBroadcasting } =
  dispatchSlice.actions;

export default dispatchSlice.reducer;
