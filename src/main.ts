import { NestFactory } from '@nestjs/core';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';
import { ConfigService } from './common/config';
import fastifyCors from '@fastify/cors';

const config = ConfigService.load();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: ['log', 'warn', 'debug', 'error'],
    },
  );

  await app.register(fastifyCors, {
    origin: 'http://localhost:3000', // กำหนดให้ทุก origin สามารถเข้าถึงได้ (เปลี่ยนตามความต้องการของคุณ)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // กำหนดวิธีที่อนุญาต
    allowedHeaders: ['Content-Type', 'Authorization'], // กำหนด headers ที่อนุญาต
  });

  await app.listen(config.test_crud.port, () => {
    console.log(
      `server is running on http://localhost:${config.test_crud.port}/graphql`,
    );
  });
}
bootstrap();
