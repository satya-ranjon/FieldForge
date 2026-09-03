import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { UserRole } from '@fieldforge/contracts';

describe('UsersController', () => {
  const TOKEN_USER_ID = 'a1111111-1111-4111-8111-111111111111';
  const OTHER_USER_ID = 'b2222222-2222-4222-8222-222222222222';

  let controller: UsersController;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    mockUsersService = {
      getUserProfile: jest.fn().mockResolvedValue({ id: TOKEN_USER_ID })
    } as unknown as jest.Mocked<UsersService>;

    mockJwtService = {
      verify: jest.fn().mockReturnValue({
        sub: TOKEN_USER_ID,
        email: 'buyer@example.com',
        role: UserRole.BUYER
      })
    } as unknown as jest.Mocked<JwtService>;

    controller = new UsersController(mockUsersService, mockJwtService);
  });

  describe('GET /users/me', () => {
    it('resolves the profile from the verified token', async () => {
      await controller.getProfile('Bearer valid.jwt.token');

      expect(mockUsersService.getUserProfile).toHaveBeenCalledWith(TOKEN_USER_ID);
    });

    it('rejects an x-ff-user-id that does not match the token', async () => {
      // This service listens on 0.0.0.0 with no NetworkPolicy in front of it, so
      // the header is attacker-controllable. Trusting it over the token let an
      // anonymous caller read any profile by guessing a user id.
      await expect(controller.getProfile('Bearer valid.jwt.token', OTHER_USER_ID)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockUsersService.getUserProfile).not.toHaveBeenCalled();
    });

    it('never reads a profile for a header-only identity', async () => {
      // The pre-fix handler returned OTHER_USER_ID's profile for this exact
      // request: no Authorization header, just a guessed id.
      await expect(controller.getProfile(undefined, OTHER_USER_ID)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockUsersService.getUserProfile).not.toHaveBeenCalled();
    });

    it('accepts a matching x-ff-user-id from the gateway', async () => {
      await controller.getProfile('Bearer valid.jwt.token', TOKEN_USER_ID);

      expect(mockUsersService.getUserProfile).toHaveBeenCalledWith(TOKEN_USER_ID);
    });

    it('throws when no authorization header is present', async () => {
      await expect(controller.getProfile()).rejects.toThrow(UnauthorizedException);
    });

    it.each([
      ['a non-Bearer scheme', 'Basic dXNlcjpwYXNz'],
      ['a Bearer scheme with no credentials', 'Bearer'],
      ['an empty value', '']
    ])('throws on %s', async (_label, header) => {
      await expect(controller.getProfile(header)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.getUserProfile).not.toHaveBeenCalled();
    });

    it('throws when the token fails verification', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(controller.getProfile('Bearer tampered.jwt.token')).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockUsersService.getUserProfile).not.toHaveBeenCalled();
    });

    it('ignores a forged token even when a matching header accompanies it', async () => {
      // A forged token plus a consistent header must not pass: the signature is
      // what is checked, and the header agreeing with it proves nothing.
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(controller.getProfile('Bearer forged.jwt.token', OTHER_USER_ID)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockUsersService.getUserProfile).not.toHaveBeenCalled();
    });
  });
});
