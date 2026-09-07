import { BidsController } from '../src/modules/bids/bids.controller';
import type { BidsService } from '../src/modules/bids/bids.service';
import type { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('BidsController', () => {
  let controller: BidsController;
  let mockBidsService: Record<string, jest.Mock>;
  let mockJwtService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockBidsService = {
      submitBid: jest.fn().mockResolvedValue({
        id: 'bid-1',
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        bidAmountMinor: 35000,
        bidStatus: 'PENDING'
      }),
      acceptBid: jest.fn().mockResolvedValue({
        id: 'bid-1',
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        bidAmountMinor: 35000,
        bidStatus: 'ACCEPTED'
      }),
      listBidsForWorkOrder: jest.fn().mockResolvedValue([
        {
          id: 'bid-1',
          workOrderId: 'wo-1',
          technicianId: 'tech-1',
          bidAmountMinor: 35000,
          bidStatus: 'PENDING'
        }
      ]),
      getBidById: jest.fn().mockResolvedValue({
        id: 'bid-1',
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        bidAmountMinor: 35000,
        bidStatus: 'PENDING'
      })
    };

    mockJwtService = {
      verify: jest.fn()
    };

    controller = new BidsController(
      mockBidsService as unknown as BidsService,
      mockJwtService as unknown as JwtService
    );
  });

  describe('submitBidOnWorkOrder', () => {
    it('successfully submits a bid for a technician', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-tech-1',
        role: 'TECHNICIAN',
        profileId: 'tech-profile-1'
      });

      const VALID_WO_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
      const result = await controller.submitBidOnWorkOrder(
        VALID_WO_ID,
        { bidAmountMinor: 35000, counterNote: 'Ready' },
        'Bearer token',
        'user-tech-1',
        'corr-1',
        'idemp-1',
        'tech-profile-1'
      );

      expect(result.id).toBe('bid-1');
      expect(mockBidsService.submitBid).toHaveBeenCalledWith(
        expect.objectContaining({ workOrderId: VALID_WO_ID, bidAmountMinor: 35000 }),
        'user-tech-1',
        'corr-1',
        'idemp-1',
        'tech-profile-1'
      );
    });

    it('rejects submission from non-technicians', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-buyer-1',
        role: 'BUYER'
      });

      await expect(
        controller.submitBidOnWorkOrder(
          'wo-1',
          { bidAmountMinor: 35000 },
          'Bearer token',
          'user-buyer-1'
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('acceptBidOnWorkOrder', () => {
    it('successfully accepts a bid for a buyer', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-buyer-1',
        role: 'BUYER',
        profileId: 'buyer-profile-1'
      });

      const result = await controller.acceptBidOnWorkOrder(
        'wo-1',
        'bid-1',
        'Bearer token',
        'user-buyer-1',
        'corr-1',
        'idemp-1',
        'buyer-profile-1'
      );

      expect(result.bidStatus).toBe('ACCEPTED');
      expect(mockBidsService.acceptBid).toHaveBeenCalledWith(
        'bid-1',
        'user-buyer-1',
        'BUYER',
        'corr-1',
        'idemp-1',
        'buyer-profile-1',
        'wo-1'
      );
    });

    it('rejects acceptance from technicians', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-tech-1',
        role: 'TECHNICIAN'
      });

      await expect(
        controller.acceptBidOnWorkOrder('wo-1', 'bid-1', 'Bearer token', 'user-tech-1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listBidsForWorkOrder', () => {
    it('lists bids for the work order', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-buyer-1',
        role: 'BUYER',
        profileId: 'buyer-profile-1'
      });

      const result = await controller.listBidsForWorkOrder(
        'wo-1',
        'Bearer token',
        'user-buyer-1',
        'buyer-profile-1'
      );

      expect(result).toHaveLength(1);
      expect(mockBidsService.listBidsForWorkOrder).toHaveBeenCalledWith(
        'wo-1',
        'user-buyer-1',
        'BUYER',
        'buyer-profile-1'
      );
    });
  });

  describe('C5 identity check', () => {
    it('rejects mismatched user ID header', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-real',
        role: 'BUYER'
      });

      await expect(
        controller.listBidsForWorkOrder('wo-1', 'Bearer token', 'user-impostor')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
