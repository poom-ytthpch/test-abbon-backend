import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ExpenseService } from './expense.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt/jwt.auth';
import {
  CategoriesInput,
  CreateCategoriesInput,
  CreateExpenseInput,
  ExpensesInput,
  ExpensesReportInput,
  UpdateExpenseInput,
} from '../types/gql';

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

  @UseGuards(JwtAuthGuard)
  @Query()
  async categories(@Args('input') input: CategoriesInput) {
    return this.expenseService.categories(input);
  }

  @UseGuards(JwtAuthGuard)
  @Query()
  async expenses(@Args('input') input: ExpensesInput) {
    return this.expenseService.expenses(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation()
  async updateExpense(@Args('input') input: UpdateExpenseInput) {
    return this.expenseService.updateExpense(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation()
  async removeExpense(@Args('id') id: string) {
    return this.expenseService.removeExpense(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query()
  async expensesReport(@Args('input') input: ExpensesReportInput) {
    return this.expenseService.expensesReport(input);
  }
}
