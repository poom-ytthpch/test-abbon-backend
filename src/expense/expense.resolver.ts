import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ExpenseService } from './expense.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt/jwt.auth';
import {
  CategoriesInput,
  Category,
  CreateCategoriesInput,
  CreateExpenseInput,
  Expense,
  ExpensesInput,
  ExpensesReportInput,
  ExpensesReportResponse,
  UpdateExpenseInput,
} from '../types/gql';
import { RateLimit } from 'nestjs-rate-limiter';

@Resolver('Expense')
export class ExpenseResolver {
  constructor(private readonly expenseService: ExpenseService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => [Category])
  async createCategories(@Args('input') input: CreateCategoriesInput) {
    return this.expenseService.createCategories(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Expense)
  async createExpense(@Args('input') input: CreateExpenseInput) {
    return this.expenseService.createExpense(input);
  }

  @RateLimit({
    keyPrefix: 'ratelimit:expenses',
    points: 10,
    duration: 60,
    blockDuration: 0,
  })
  @UseGuards(JwtAuthGuard)
  @Query(() => [Category])
  async categories(@Args('input') input: CategoriesInput) {
    return this.expenseService.categories(input);
  }

  @RateLimit({
    keyPrefix: 'ratelimit:expenses',
    points: 10,
    duration: 60,
    blockDuration: 0,
  })
  @UseGuards(JwtAuthGuard)
  @Query(() => [Expense])
  async expenses(@Args('input') input: ExpensesInput) {
    return this.expenseService.expenses(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Expense)
  async updateExpense(@Args('input') input: UpdateExpenseInput) {
    return this.expenseService.updateExpense(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Expense)
  async removeExpense(@Args('id') id: string) {
    return this.expenseService.removeExpense(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ExpensesReportResponse])
  async expensesReport(@Args('input') input: ExpensesReportInput) {
    return this.expenseService.expensesReport(input);
  }
}
