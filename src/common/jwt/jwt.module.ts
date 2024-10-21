import { Module } from '@nestjs/common';
import { ConfigService } from '../config';
import { JwtModule } from '@nestjs/jwt';
import { JWTService } from './jwt.service';

const config = ConfigService.load()

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: config.sms.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [JWTService],
//   controllers: [AuthController],
  exports: [JWTService],
})
export class JWTModule {}