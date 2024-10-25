import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginInput, RegisterInput } from '../types/gql';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const input: RegisterInput = {
        email: 'test@example.com',
        userName: 'testUser',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'user1', email: input.email, userName: input.userName });

      const result = await service.register(input);
      expect(result).toHaveProperty('email', input.email);
      expect(logger.debug).toBeCalled();
    });

    it('should throw BadRequestException if email format is invalid', async () => {
      const input: RegisterInput = { email: 'invalid', userName: 'testUser', password: 'Password123', confirmPassword: 'Password123' };

      await expect(service.register(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password and confirmPassword do not match', async () => {
      const input: RegisterInput = { email: 'test@example.com', userName: 'testUser', password: 'Password123', confirmPassword: 'DifferentPassword' };

      await expect(service.register(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email already exists', async () => {
      const input: RegisterInput = { email: 'test@example.com', userName: 'testUser', password: 'Password123', confirmPassword: 'Password123' };
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      await expect(service.register(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException if user creation fails', async () => {
      const input: RegisterInput = { email: 'test@example.com', userName: 'testUser', password: 'Password123', confirmPassword: 'Password123' };
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(service.register(input)).rejects.toThrow(InternalServerErrorException);
      expect(logger.error).toBeCalled();
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const input: LoginInput = { email: 'test@example.com', password: 'Password123' };
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = { id: 'user1', email: input.email, password: hashedPassword };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'sign').mockImplementation(() => 'mockToken');

      const result = await service.login(input);
      expect(result).toEqual({ token: 'mockToken', refreshToken: 'mockToken', status: true });
      expect(logger.debug).toBeCalled();
    });

    it('should throw BadRequestException if user is not found', async () => {
      const input: LoginInput = { email: 'nonexistent@example.com', password: 'Password123' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      const input: LoginInput = { email: 'test@example.com', password: 'wrongPassword' };
      const user = { id: 'user1', email: input.email, password: await bcrypt.hash('Password123', 10) };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.login(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException if findUnique fails', async () => {
      const input: LoginInput = { email: 'test@example.com', password: 'Password123' };
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(service.login(input)).rejects.toThrow(InternalServerErrorException);
      expect(logger.error).toBeCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const accessToken = 'mockAccessToken';
      const decodedToken = { userInfo: { email: 'test@example.com', userName: 'testUser', userId: 'user1' } };

      jest.spyOn(jwt, 'verify').mockReturnValue(decodedToken as any);
      jest.spyOn(jwt, 'sign').mockReturnValue('newMockToken');

      const result = await service.refreshToken(accessToken);
      expect(result).toEqual({ token: 'newMockToken', refreshToken: 'newMockToken', status: true });
      expect(logger.debug).toBeCalled();
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      const accessToken = 'invalidToken';

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Token error');
      });

      await expect(service.refreshToken(accessToken)).rejects.toThrow(UnauthorizedException);
      expect(logger.error).toBeCalled();
    });
  });
});
