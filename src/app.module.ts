import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ExpenseModule } from './expense/expense.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { PrismaModule } from './common/prisma/prisma.module';
import { PrismaService } from './common/prisma/prisma.service';
import { RateLimiterModule } from 'nestjs-rate-limiter';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

import * as winston from 'winston';
@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = meta ? JSON.stringify(meta) : '';
          return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
        }),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaString = meta ? JSON.stringify(meta) : '';
              return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
            }),
            nestWinstonModuleUtilities.format.nestLike('TEST_FOR_BACKEND', {
              colors: true,
              prettyPrint: true,
              processId: true,
              appName: true,
            }),
          ),
        }),
        // new winston.transports.Console(),
      ],
    }),
    RateLimiterModule.registerAsync({
      useFactory: () => ({
        for: 'FastifyGraphql',
        duration: 60,
        points: 10,
        global: true,
        maxQueueSize: 1000,
        omitResponseHeaders: false,
        errorMessage: 'Rate limit exceeded',
        logger: true,
        disable: false,
      }),
    }),
    AuthModule,
    ExpenseModule,
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      context: ({ request, reply }) => {
        return { req: request, res: reply };
      },
      typePaths: ['./src/**/*.graphql'],
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      subscriptions: {
        'subscriptions-transport-ws': true,
        'graphql-ws': true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
