import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ExpenseService } from './expense.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/jwt/jwt.auth';
import { CreateCategoriesInput, CreateExpenseInput } from 'src/types/gql';

@Resolver('Expense')
export class ExpenseResolver {
  constructor(private readonly expenseService: ExpenseService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation()
  async createCategories(@Args('input') input: CreateCategoriesInput) {
    return this.expenseService.createCategories(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation()
  async createExpense(@Args('input') input: CreateExpenseInput) {
    return this.expenseService.createExpense(input);
  }
}
