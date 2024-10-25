import { NestFactory } from '@nestjs/core';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ConfigService } from './common/config';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

const config = ConfigService.load();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  await app.register(fastifyCors, {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.register(fastifyHelmet, {
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: [
                `'self' https: http: ws: wss: 'unsafe-eval' 'unsafe-inline'`,
              ],
              styleSrc: [
                `'self'`,
                `'unsafe-inline'`,
                'cdn.jsdelivr.net',
                'fonts.googleapis.com',
              ],
              fontSrc: [`'self'`, 'fonts.gstatic.com'],
              imgSrc: [
                `'self'`,
                'data:',
                'cdn.jsdelivr.net',
                'apollo-server-landing-page.cdn.apollographql.com',
              ],
              scriptSrc: [
                `'self'`,
                `https: 'unsafe-inline'`,
                `cdn.jsdelivr.net`,
              ],
            },
          }
        : false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: false,
    },
  });

  await app.listen(config.test_crud.port, () => {
    console.log(
      `server is running on http://localhost:${config.test_crud.port}/graphql`,
    );
  });
}
bootstrap();
