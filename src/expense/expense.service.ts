import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateCategoriesInput, CreateExpenseInput } from 'src/types/gql';

@Injectable()
export class ExpenseService {
  constructor(private readonly repos: PrismaService) {}

  async createCategories(input: CreateCategoriesInput) {
    const { names } = input;
    const category = await this.repos.category.createMany({
      data: names.map((name) => ({ name })),
    });

    return category;
  }

  async createExpense(input: CreateExpenseInput) {
    const { title, amount, userId, notes, categoryId } = input;

    const expense = await this.repos.expense.create({
      data: {
        title,
        amount,
        notes,
        category: {
          connect: {
            id: categoryId,
          },
        },
        date: new Date(),
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return expense;
  }
}
