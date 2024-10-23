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

@Module({
  imports: [
    AuthModule,
    ExpenseModule,
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
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
