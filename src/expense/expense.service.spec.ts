import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  CreateCategoriesInput,
  CreateExpenseInput,
  CategoriesInput,
  ExpensesInput,
  ExpensesReportInput,
} from '../types/gql';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let prisma: PrismaService;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    prisma = {
      category: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      expense: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      $queryRaw: jest.fn(),
    } as unknown as PrismaService;

    logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        { provide: PrismaService, useValue: prisma },
        { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
  });

  describe('createCategories', () => {
    it('should create categories successfully', async () => {
      const input: CreateCategoriesInput = { names: ['Food', 'Transport'] };
      (prisma.category.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.createCategories(input);
      expect(result).toEqual({ count: 2 });
      expect(logger.debug).toBeCalled();
    });

    it('should throw an error if category creation fails', async () => {
      (prisma.category.createMany as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        service.createCategories({ names: ['Food'] }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(logger.error).toBeCalled();
    });
  });

  describe('createExpense', () => {
    it('should create an expense successfully', async () => {
      const input: CreateExpenseInput = {
        title: 'Lunch',
        amount: 15,
        userId: 'user1',
        categoryId: 'cat1',
        notes: 'Lunch',
        date: new Date(),
      };
      (prisma.expense.create as jest.Mock).mockResolvedValue({
        id: 'exp1',
        ...input,
        category: { id: 'cat1', name: 'Food' },
      });

      const result = await service.createExpense(input);
      expect(result).toHaveProperty('title', 'Lunch');
      expect(logger.debug).toBeCalled();
    });

    it('should throw an error if expense creation fails', async () => {
      (prisma.expense.create as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        service.createExpense({
          title: 'Dinner',
          amount: 20,
          userId: 'user1',
          categoryId: 'cat1',
          date: new Date(),
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(logger.error).toBeCalled();
    });
  });

  describe('categories', () => {
    it('should return a list of categories', async () => {
      const input: CategoriesInput = { take: 10, skip: 0 };
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat1', name: 'Food' },
      ]);

      const result = await service.categories(input);
      expect(result).toEqual([{ id: 'cat1', name: 'Food' }]);
    });

    it('should throw an error if category query fails', async () => {
      (prisma.category.findMany as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(service.categories({ take: 10, skip: 0 })).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toBeCalled();
    });
  });

  describe('expenses', () => {
    it('should return a list of expenses', async () => {
      const input: ExpensesInput = {
        userId: 'user1',
        startDate: new Date(),
        endDate: new Date(),
        take: 5,
        skip: 0,
      };
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([
        { id: 'exp1', title: 'Lunch', amount: 15, date: new Date() },
      ]);

      const result = await service.expenses(input);
      expect(result).toEqual([
        { id: 'exp1', title: 'Lunch', amount: 15, date: new Date() },
      ]);
    });

    it('should throw an error if expense query fails', async () => {
      (prisma.expense.findMany as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        service.expenses({
          userId: 'user1',
          startDate: new Date(),
          endDate: new Date(),
          take: 5,
          skip: 0,
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(logger.error).toBeCalled();
    });
  });

  describe('updateExpense', () => {
    it('should update an expense successfully', async () => {
      const input = {
        id: 'exp1',
        title: 'Dinner',
        amount: 20,
        date: new Date(),
        categoryId: '747c2c89-5990-429e-8bc3-566d04e45af6',
      };

      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({
        id: 'exp1',
        title: 'Lunch',
        amount: 15,
        date: new Date(),
        categoryId: '747c2c89-5990-429e-8bc3-566d04e45af6',
      });

      (prisma.expense.update as jest.Mock).mockResolvedValue({
        id: 'exp1',
        title: 'Dinner',
        amount: 20,
        date: new Date(),
        categoryId: '747c2c89-5990-429e-8bc3-566d04e45af6',
      });

      const result = await service.updateExpense({
        id: input.id,
        title: input.title,
        amount: input.amount,
        date: input.date,
        categoryId: input.categoryId,
      });

      expect(result).toEqual({
        id: 'exp1',
        title: 'Dinner',
        amount: 20,
        date: expect.any(Date),
        categoryId: '747c2c89-5990-429e-8bc3-566d04e45af6',
      });
    });
  });

  describe('removeExpense', () => {
    it('should delete an expense successfully', async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue({
        id: 'exp1',
        title: 'Dinner',
      });
      (prisma.expense.delete as jest.Mock).mockResolvedValue({
        id: 'exp1',
        title: 'Dinner',
      });

      const result = await service.removeExpense('exp1');
      expect(result).toHaveProperty('id', 'exp1');
      expect(logger.debug).toBeCalled();
    });

    it('should throw NotFoundException if expense to delete is not found', async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.removeExpense('exp1')).rejects.toThrow(
        NotFoundException,
      );
      expect(logger.error).toBeCalled();
    });
  });

  describe('expensesReport', () => {
    it('should return an expense report with correct amounts per category', async () => {
      const input: ExpensesReportInput = {
        userId: 'user1',
        startDate: new Date(),
        endDate: new Date(),
        take: 100,
        skip: 0,
      };

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { amount: 30, category: 'Food', userName: 'user1', date: new Date() },
        {
          amount: 20,
          category: 'Transport',
          userName: 'user1',
          date: new Date(),
        },
        { amount: 50, category: 'Food', userName: 'user1', date: new Date() },
        {
          amount: 15,
          category: 'Utilities',
          userName: 'user1',
          date: new Date(),
        },
        {
          amount: 25,
          category: 'Transport',
          userName: 'user1',
          date: new Date(),
        },
        {
          amount: 60,
          category: 'Entertainment',
          userName: 'user1',
          date: new Date(),
        },
        { amount: 35, category: 'Food', userName: 'user1', date: new Date() },
        {
          amount: 40,
          category: 'Utilities',
          userName: 'user1',
          date: new Date(),
        },
        {
          amount: 10,
          category: 'Transport',
          userName: 'user1',
          date: new Date(),
        },
        { amount: 25, category: 'Food', userName: 'user1', date: new Date() },
      ]);

      const result = await service.expensesReport(input);

      const totalAmountPerCategory = result.reduce((acc, expense) => {
        if (!acc[expense.category]) acc[expense.category] = 0;
        acc[expense.category] += expense.amount;
        return acc;
      }, {});

      const expectedSums = {
        Food: 140,
        Transport: 55,
        Utilities: 55,
        Entertainment: 60,
      };

      expect(totalAmountPerCategory).toEqual(expectedSums);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            amount: 30,
            category: 'Food',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 20,
            category: 'Transport',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 50,
            category: 'Food',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 15,
            category: 'Utilities',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 25,
            category: 'Transport',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 60,
            category: 'Entertainment',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 35,
            category: 'Food',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 40,
            category: 'Utilities',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 10,
            category: 'Transport',
            userName: 'user1',
          }),
          expect.objectContaining({
            amount: 25,
            category: 'Food',
            userName: 'user1',
          }),
        ]),
      );
    });

    it('should throw an error if report query fails', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(
        service.expensesReport({
          userId: 'user1',
          startDate: new Date(),
          endDate: new Date(),
          take: 100,
          skip: 0,
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(logger.error).toBeCalled();
    });
  });
});
