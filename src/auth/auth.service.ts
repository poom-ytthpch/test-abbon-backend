import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { LoginInput, LoginResponse, RegisterInput, User } from '../types/gql';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '../common/config';
import to from 'await-to-js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

const config = ConfigService.load();

@Injectable()
export class AuthService {
  constructor(
    private readonly repos: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async register(input: RegisterInput) {
    this.logger.debug(
      `${AuthService.name}:${this.register.name} - input: ${JSON.stringify(input)}`,
    );

    const { email, userName, password, confirmPassword } = input;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        `Password and confirm password don't match!`,
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }

    if ((await this.repos.user.count({ where: { email } })) > 0) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [err, result] = await to(
      this.repos.user.create({
        data: {
          password: hashedPassword,
          email,
          userName,
        },
      }),
    );

    if (err) {
      this.logger.error(
        `${AuthService.name}:${this.register.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return result;
  }

  async login(input: LoginInput) {
    this.logger.debug(
      `${AuthService.name}:${this.login.name} - input: ${JSON.stringify(input)}`,
    );

    const { email, password } = input;

    const [err, userExist] = await to(
      this.repos.user.findUnique({
        where: {
          email,
        },
      }),
    );

    if (err) {
      this.logger.error(
        `${AuthService.name}:${this.login.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    if (!userExist) {
      throw new BadRequestException('User not found');
    }

    const compare = await bcrypt.compare(password, userExist.password);

    if (!compare) {
      throw new BadRequestException('Wrong password');
    }

    const token = await jwt.sign(
      {
        userInfo: {
          id: userExist.id,
          email: userExist.email,
        },
      },
      config.test_crud.secret,
      {
        expiresIn: '15m',
      },
    );

    const refreshToken = await jwt.sign(
      {
        userInfo: {
          id: userExist.id,
          email: userExist.email,
        },
      },
      config.test_crud.secret,
      {
        expiresIn: '2h',
      },
    );

    return { token, refreshToken, status: true } as LoginResponse;
  }

  async refreshToken(accessToken: string): Promise<LoginResponse> {
    this.logger.debug(
      `${AuthService.name}:${this.refreshToken.name} - accessToken: ${accessToken}`,
    );

    try {
      const decoded = jwt.verify(accessToken, config.test_crud.secret);
      const token = await jwt.sign(
        {
          userInfo: {
            email: decoded.userInfo.email,
            userName: decoded.userInfo.userName,
            status: decoded.userInfo.status,
            roles: decoded.userInfo.roles,
            userId: decoded.userInfo.userId,
          },
        },
        config.test_crud.secret,
        {
          expiresIn: '15m',
        },
      );

      const refreshToken = await jwt.sign(
        {
          userInfo: {
            email: decoded.userInfo.email,
            userName: decoded.userInfo.userName,
            status: decoded.userInfo.status,
            roles: decoded.userInfo.roles,
            userId: decoded.userInfo.userId,
          },
        },
        config.test_crud.secret,
        {
          expiresIn: '1h',
        },
      );

      return { token, refreshToken, status: true } as LoginResponse;
    } catch (error) {
      this.logger.error(
        `${AuthService.name}:${this.refreshToken.name} - error: ${JSON.stringify(error)}`,
      );
      throw new UnauthorizedException();
    }
  }
}
