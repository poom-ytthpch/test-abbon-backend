import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseResolver } from './expense.resolver';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  providers: [ExpenseResolver, ExpenseService, PrismaService],
})
export class ExpenseModule {}
