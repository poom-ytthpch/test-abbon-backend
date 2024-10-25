import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CategoriesInput,
  Category,
  CreateCategoriesInput,
  CreateCategoriesResponse,
  CreateExpenseInput,
  Expense,
  ExpensesInput,
  ExpensesReportInput,
  ExpensesReportResponse,
  UpdateExpenseInput,
} from '../types/gql';
import to from 'await-to-js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly repos: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createCategories(input: CreateCategoriesInput): Promise<CreateCategoriesResponse> {
    this.logger.debug(
      `${ExpenseService.name}:${this.createCategories.name} - input: ${JSON.stringify(input)}`,
    );

    const { names } = input;
    const [err, categories] = await to(
      this.repos.category.createMany({
        data: names.map((name) => ({ name })),
      }),
    );

    if (err) {
      this.logger.error(
        `${ExpenseService.name}:${this.createCategories.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return categories as CreateCategoriesResponse;
  }

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    this.logger.debug(
      `${ExpenseService.name}:${this.createExpense.name} - input: ${JSON.stringify(input)}`,
    );

    const { title, amount, userId, notes, categoryId, date } = input;

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
          date: new Date(date),
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
      this.logger.error(
        `${ExpenseService.name}:${this.createExpense.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return expense;
  }

  async categories(input: CategoriesInput): Promise<Category[]> {
    this.logger.debug(
      `${ExpenseService.name}:${this.categories.name} - input: ${JSON.stringify(input)}`,
    );

    const { take, skip } = input;

    const [err, categories] = await to(
      this.repos.category.findMany({
        take,
        skip,
      }),
    );

    if (err) {
      this.logger.error(
        `${ExpenseService.name}:${this.categories.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return categories as Category[];
  }

  async expenses(input: ExpensesInput): Promise<Expense[]> {
    this.logger.debug(
      `${ExpenseService.name}:${this.expenses.name} - input: ${JSON.stringify(input)}`,
    );

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
      this.logger.error(
        `${ExpenseService.name}:${this.expenses.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return expenses as Expense[];
  }

  async updateExpense(input: UpdateExpenseInput): Promise<Expense> {
    this.logger.debug(
      `${ExpenseService.name}:${this.updateExpense.name} - input: ${JSON.stringify(input)}`,
    );

    const { id, title, amount, notes, categoryId, date } = input;

    await this.expenseValidation(id);

    const [err, expense] = await to(
      this.repos.expense.update({
        where: {
          id,
        },
        data: {
          title,
          amount,
          notes: notes ?? null,
          date: new Date(date),
          category: {
            connect: {
              id: categoryId,
            },
          },
        },
      }),
    );

    if (err) {
      this.logger.error(
        `${ExpenseService.name}:${this.updateExpense.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return expense;
  }

  async removeExpense(id: string): Promise<Expense> {
    this.logger.debug(
      `${ExpenseService.name}:${this.removeExpense.name} - id: ${id}`,
    );

    await this.expenseValidation(id);

    const [err, deleted] = await to(
      this.repos.expense.delete({
        where: {
          id,
        },
      }),
    );

    if (err) {
      this.logger.error(
        `${ExpenseService.name}:${this.removeExpense.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return deleted;
  }

  private async expenseValidation(id: string) {
    this.logger.debug(
      `${ExpenseService.name}:${this.expenseValidation.name} - id: ${id}`,
    );

    const [err, expense] = await to(
      this.repos.expense.findUnique({
        where: {
          id,
        },
      }),
    );

    if (err) {
      this.logger.error(
        `${ExpenseService.name}:${this.expenseValidation.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    if (!expense) {
      this.logger.error(
        `${ExpenseService.name}:${this.expenseValidation.name} - error: Expense not found`,
      );
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async expensesReport(
    input: ExpensesReportInput,
  ): Promise<ExpensesReportResponse[]> {
    this.logger.debug(
      `${ExpenseService.name}:${this.expensesReport.name} - input: ${JSON.stringify(input)}`,
    );

    const { userId, startDate, endDate } = input;

    const [err, expenses] = await to(this.repos.$queryRaw<
      { amount: number; category: string; userName: string; date: Date }[]
    >`
    SELECT SUM(amount) AS amount, c.name AS category, u.email, e.date, u.userName
    FROM Expense AS e 
    JOIN Category AS c ON e.categoryId = c.id 
    JOIN User AS u ON e.userId = u.id 
    WHERE e.date >= ${startDate} 
    AND e.date <= ${endDate}
    AND e.userId = ${userId}
    GROUP BY c.name, e.userId 
    ORDER BY u.email;
    `);

    if (err) {
      this.logger.error(
        `${ExpenseService.name}:${this.expensesReport.name} - error: ${JSON.stringify(err)}`,
      );
      throw new InternalServerErrorException(err.message);
    }

    return expenses as ExpensesReportResponse[];
  }
}
