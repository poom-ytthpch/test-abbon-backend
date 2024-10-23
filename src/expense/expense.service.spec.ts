import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ExpensesReportInput } from '../types/gql';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpenseService, PrismaService],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should return expenses report with valid input', async () => {
    const input: ExpensesReportInput = {
      userId: '1',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-01-31'),
      take: 10,
      skip: 0,
    };

    const result = await service.expensesReport(input);
    expect(result).toBeInstanceOf(Array);
    expect(result).not.toBeNull();
  });

  it('should return empty array with invalid input', async () => {
    const input: ExpensesReportInput = {
      userId: null,
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-01-31'),
      take: 10,
      skip: 0,
    };

    const result = await service.expensesReport(input);
    expect(result).toBeInstanceOf(Array);
    expect(result).toEqual([]);
  });

  it('should return empty array with empty result set', async () => {
    const input: ExpensesReportInput = {
      userId: '1',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-01-01'),
      take: 10,
      skip: 0,
    };

    jest.spyOn(prismaService, '$queryRaw').mockResolvedValueOnce([]);
    const result = await service.expensesReport(input);
    expect(result).toBeInstanceOf(Array);
    expect(result).toEqual([]);
  });

  it('should return multiple result sets', async () => {
    const input: ExpensesReportInput = {
      userId: '1',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-01-31'),
      take: 10,
      skip: 0,
    };

    const resultSets = [
      {
        amount: 100,
        category: 'Food',
        userName: 'John Doe',
        date: new Date('2022-01-15'),
      },
      {
        amount: 200,
        category: 'Transportation',
        userName: 'John Doe',
        date: new Date('2022-01-20'),
      },
    ];

    jest.spyOn(prismaService, '$queryRaw').mockResolvedValueOnce(resultSets);
    const result = await service.expensesReport(input);
    expect(result).toBeInstanceOf(Array);
    expect(result).toEqual(resultSets);
  });
});
