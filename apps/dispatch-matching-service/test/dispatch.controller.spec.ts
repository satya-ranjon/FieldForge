import { DispatchController } from '../src/modules/dispatch/dispatch.controller';
import type { GeoSearchService } from '../src/modules/geo-search/geo-search.service';
import type { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('DispatchController', () => {
  let controller: DispatchController;
  let mockGeoSearchService: {
    updateTechnicianLocation: jest.Mock;
    findNearbyTechnicians: jest.Mock;
  };
  let mockJwtService: { verify: jest.Mock };

  beforeEach(() => {
    mockGeoSearchService = {
      updateTechnicianLocation: jest.fn().mockResolvedValue(1),
      findNearbyTechnicians: jest.fn().mockResolvedValue([
        {
          technicianId: 'tech-1',
          fullName: 'Alice Smith',
          rating: 4.95,
          distanceMiles: 2.1,
          isAvailable: true,
          completedJobsCount: 40
        }
      ])
    };

    mockJwtService = {
      verify: jest.fn()
    };

    controller = new DispatchController(
      mockGeoSearchService as unknown as GeoSearchService,
      mockJwtService as unknown as JwtService
    );
  });

  describe('updateLocation', () => {
    it('successfully updates location for a certified technician', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-tech-1',
        role: 'TECHNICIAN'
      });

      const result = await controller.updateLocation(
        { latitude: 37.7749, longitude: -122.4194 },
        'Bearer token',
        'user-tech-1'
      );

      expect(result.statusCode).toBe(200);
      expect(mockGeoSearchService.updateTechnicianLocation).toHaveBeenCalledWith(
        'user-tech-1',
        37.7749,
        -122.4194
      );
    });

    it('rejects location updates from buyers', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-buyer-1',
        role: 'BUYER'
      });

      await expect(
        controller.updateLocation(
          { latitude: 37.7749, longitude: -122.4194 },
          'Bearer token',
          'user-buyer-1'
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findNearby', () => {
    it('returns nearby technicians based on geospatial coordinates', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-buyer-1',
        role: 'BUYER'
      });

      const result = await controller.findNearby(
        { latitude: '37.7749', longitude: '-122.4194', radiusMiles: '15' },
        'Bearer token',
        'user-buyer-1'
      );

      expect(result.count).toBe(1);
      expect(mockGeoSearchService.findNearbyTechnicians).toHaveBeenCalledWith(
        37.7749,
        -122.4194,
        15
      );
    });
  });

  describe('autoRouteRecommend', () => {
    it('returns the top available candidate contractor for auto-routing', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-buyer-1',
        role: 'BUYER'
      });

      const result = await controller.autoRouteRecommend(
        { latitude: 37.7749, longitude: -122.4194, maxRadiusMiles: 5 },
        'Bearer token',
        'user-buyer-1'
      );

      expect(result.technicianId).toBe('tech-1');
      expect(result.status).toBe('MATCHED');
    });

    it('throws NotFoundException when no candidates are available', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-buyer-1',
        role: 'BUYER'
      });

      mockGeoSearchService.findNearbyTechnicians.mockResolvedValue([]);

      await expect(
        controller.autoRouteRecommend(
          { latitude: 37.7749, longitude: -122.4194, maxRadiusMiles: 5 },
          'Bearer token',
          'user-buyer-1'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('C5 Token/Header Guard', () => {
    it('rejects identity spoofing when gateway header contradicts token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-real',
        role: 'BUYER'
      });

      await expect(
        controller.findNearby(
          { latitude: '37.7749', longitude: '-122.4194' },
          'Bearer token',
          'user-impostor'
        )
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
