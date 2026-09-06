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

const initialState: DispatchState = {
  nearbyTechnicians: [],
  activeBids: [],
  selectedTechId: null,
  radarRadiusMiles: 10,
  isBroadcasting: true
};

export const dispatchSlice = createSlice({
  name: 'dispatch',
  initialState,
  reducers: {
    setNearbyTechnicians: (state, action: PayloadAction<NearbyTechnicianDto[]>) => {
      state.nearbyTechnicians = action.payload;
    },
    setActiveBids: (state, action: PayloadAction<ExtendedBid[]>) => {
      state.activeBids = action.payload;
    },
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

export const {
  setNearbyTechnicians,
  setActiveBids,
  selectTechnician,
  setRadarRadius,
  acceptBid,
  rejectBid,
  toggleBroadcasting
} = dispatchSlice.actions;

export default dispatchSlice.reducer;
