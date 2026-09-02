import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole, UserStatus, toMinor } from '@fieldforge/contracts';
import type { DrizzleClient } from '@fieldforge/common';

interface MockDb {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  transaction: jest.Mock;
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockDb: MockDb;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mocked.jwt.access-token')
    } as unknown as jest.Mocked<JwtService>;

    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn()
    };

    authService = new AuthService(mockDb as unknown as DrizzleClient, mockJwtService);
  });

  describe('register', () => {
    it('throws ConflictException if email already registered', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'existing-id' }])
          })
        })
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123!',
          role: UserRole.BUYER,
          phoneNumber: '+15551234567'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('creates buyer profile and issues tokens for new buyer', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue({})
          })
        };
        return cb(tx);
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({})
      });

      const result = await authService.register({
        email: 'buyer@example.com',
        password: 'Password123!',
        role: UserRole.BUYER,
        phoneNumber: '+15551234567',
        companyName: 'Acme Corp'
      });

      expect(result.accessToken).toBe('mocked.jwt.access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('buyer@example.com');
      expect(result.user.role).toBe(UserRole.BUYER);
      expect(result.user.status).toBe(UserStatus.ACTIVE);
    });

    it('creates technician profile and issues tokens for new technician', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue({})
          })
        };
        return cb(tx);
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({})
      });

      const result = await authService.register({
        email: 'tech@example.com',
        password: 'Password123!',
        role: UserRole.TECHNICIAN,
        phoneNumber: '+15559876543',
        firstName: 'Bob',
        lastName: 'Smith',
        hourlyRateMinor: toMinor(75)
      });

      expect(result.accessToken).toBe('mocked.jwt.access-token');
      expect(result.user.role).toBe(UserRole.TECHNICIAN);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'Password123!'
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for invalid password', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword!', 10);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 'u-123',
                email: 'test@example.com',
                passwordHash,
                role: UserRole.BUYER,
                status: 'ACTIVE'
              }
            ])
          })
        })
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword!'
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens on valid login credentials', async () => {
      const password = 'CorrectPassword!';
      const passwordHash = await bcrypt.hash(password, 10);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 'u-123',
                email: 'test@example.com',
                passwordHash,
                role: UserRole.BUYER,
                status: 'ACTIVE'
              }
            ])
          })
        })
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({})
      });

      const result = await authService.login({
        email: 'test@example.com',
        password
      });

      expect(result.accessToken).toBe('mocked.jwt.access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe('u-123');
    });

    it('rejects suspended users', async () => {
      const password = 'CorrectPassword!';
      const passwordHash = await bcrypt.hash(password, 10);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 'u-123',
                email: 'test@example.com',
                passwordHash,
                role: UserRole.BUYER,
                status: 'SUSPENDED'
              }
            ])
          })
        })
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException if token not found or expired', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      await expect(authService.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates refresh token and issues new access token', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'rt-1',
                  userId: 'u-123',
                  expiresAt: new Date(Date.now() + 86400000),
                  revokedAt: null
                }
              ])
            })
          })
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  id: 'u-123',
                  email: 'test@example.com',
                  role: UserRole.BUYER,
                  status: 'ACTIVE'
                }
              ])
            })
          })
        });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({})
        })
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue({})
      });

      const result = await authService.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('mocked.jwt.access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe('u-123');
    });
  });
});
