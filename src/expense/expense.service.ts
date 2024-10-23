import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
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
import to from 'await-to-js';
@Injectable()
export class ExpenseService {
  constructor(private readonly repos: PrismaService) {}

  async createCategories(input: CreateCategoriesInput): Promise<Category[]> {
    const { names } = input;
    const [err, categories] = await to(
      this.repos.category.createMany({
        data: names.map((name) => ({ name })),
      }),
    );

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    return categories as unknown as Category[];
  }

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const { title, amount, userId, notes, categoryId } = input;

    const [err, expense] = await to(
      this.repos.expense.create({
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
        include: {
          category: true,
        },
      }),
    );

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    return expense;
  }

  async categories(input: CategoriesInput): Promise<Category[]> {
    const { take, skip } = input;

    const [err, categories] = await to(
      this.repos.category.findMany({
        take,
        skip,
      }),
    );

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    return categories as Category[];
  }

  async expenses(input: ExpensesInput): Promise<Expense[]> {
    const { userId, startDate, endDate, take, skip } = input;

    const [err, expenses] = await to(
      this.repos.expense.findMany({
        where: {
          user: {
            id: userId,
          },
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          category: true,
          user: true,
        },
        take,
        skip,
        orderBy: {
          date: 'desc',
        },
      }),
    );

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    return expenses as Expense[];
  }

  async updateExpense(input: UpdateExpenseInput): Promise<Expense> {
    const { id, title, amount, notes, categoryId } = input;

    await this.expenseValidation(id);

    const [err, expense] = await to(
      this.repos.expense.update({
        where: {
          id,
        },
        data: {
          title,
          amount,
          notes: notes || undefined,
          category: {
            connect: {
              id: categoryId,
            },
          },
        },
      }),
    );

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    return expense;
  }

  async removeExpense(id: string): Promise<Expense> {
    await this.expenseValidation(id);

    const [err, deleted] = await to(
      this.repos.expense.delete({
        where: {
          id,
        },
      }),
    );

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    return deleted;
  }

  private async expenseValidation(id: string) {
    const [err, expense] = await to(
      this.repos.expense.findUnique({
        where: {
          id,
        },
      }),
    );

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async expensesReport(
    input: ExpensesReportInput,
  ): Promise<ExpensesReportResponse[]> {
    const { userId, startDate, endDate } = input;

    const [err, expenses] = await to(this.repos.$queryRaw<
      { amount: number; category: string; userName: string; date: Date }[]
    >`
    SELECT SUM(amount) AS amount , c.name AS category , u.email , e.date , u.userName

    FROM Expense AS e 
    JOIN Category AS c ON e.categoryId = c.id 
    JOIN User AS u ON e.userId = u.id 

    WHERE e.date >= ${startDate} 
    AND e.date <= ${endDate}
    AND e.userId = ${userId}
    GROUP BY c.name , e.userId 
    ORDER BY u.email;
    `);

    if (err) {
      throw new InternalServerErrorException(err.message);
    }

    return expenses as ExpensesReportResponse[];
  }
}
