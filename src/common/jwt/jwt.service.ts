import { Injectable, UnauthorizedException , ExecutionContext} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config';

const config = ConfigService.load();

type Payload = {
  email: string;
  userName: string;
};

@Injectable()
export class JWTService {
  constructor(private readonly jwtService: JwtService) {}

  async sign(payload: Payload): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }

}
