import { BadRequestException, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { LoginInput, LoginResponse, RegisterInput, User } from 'src/types/gql';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ConfigService } from 'src/common/config';
const config = ConfigService.load();

@Injectable()
export class AuthService {
  constructor(private readonly repos: PrismaService) {}

  async register(input: RegisterInput) {
    const { email, password, confirmPassword } = input;

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

    const result = (await this.repos.user.create({
      data: {
        password: hashedPassword,
        email,
      },
    })) as User;

    return result;
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    console.log({ email, password });

    const userExist = await this.repos.user.findUnique({
      where: {
        email,
      },
    });

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
}
