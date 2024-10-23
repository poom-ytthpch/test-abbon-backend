import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseResolver } from './expense.resolver';

@Module({
  providers: [ExpenseResolver, ExpenseService],
})
export class ExpenseModule {}
