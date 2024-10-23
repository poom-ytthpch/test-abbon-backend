
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export class RegisterInput {
    email?: Nullable<string>;
    userName?: Nullable<string>;
    password?: Nullable<string>;
    confirmPassword?: Nullable<string>;
}

export class LoginInput {
    email?: Nullable<string>;
    password?: Nullable<string>;
}

export class CreateExpenseInput {
    title: string;
    amount: number;
    categoryId: string;
    notes?: Nullable<string>;
    userId: string;
}

export class UpdateExpenseInput {
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    notes?: Nullable<string>;
}

export class CreateCategoriesInput {
    names?: Nullable<Nullable<string>[]>;
}

export class CategoriesInput {
    take: number;
    skip: number;
}

export class ExpensesInput {
    userId: string;
    startDate: Date;
    endDate: Date;
    take: number;
    skip: number;
}

export class ExpensesReportInput {
    userId: string;
    startDate: Date;
    endDate: Date;
    take: number;
    skip: number;
}

export class User {
    id?: Nullable<string>;
    email?: Nullable<string>;
    userName?: Nullable<string>;
}

export class LoginResponse {
    status?: Nullable<boolean>;
    token?: Nullable<string>;
    refreshToken?: Nullable<string>;
}

export abstract class IQuery {
    abstract users(): Nullable<Nullable<User>[]> | Promise<Nullable<Nullable<User>[]>>;

    abstract categories(input?: Nullable<CategoriesInput>): Nullable<Nullable<Category>[]> | Promise<Nullable<Nullable<Category>[]>>;

    abstract expenses(input: ExpensesInput): Nullable<Expense>[] | Promise<Nullable<Expense>[]>;

    abstract expense(id: number): Nullable<Expense> | Promise<Nullable<Expense>>;

    abstract expensesReport(input: ExpensesReportInput): Nullable<ExpensesReportResponse>[] | Promise<Nullable<ExpensesReportResponse>[]>;
}

export abstract class IMutation {
    abstract register(input: RegisterInput): User | Promise<User>;

    abstract login(input: LoginInput): LoginResponse | Promise<LoginResponse>;

    abstract refreshToken(accessToken: string): LoginResponse | Promise<LoginResponse>;

    abstract createCategories(input: CreateCategoriesInput): Nullable<Category>[] | Promise<Nullable<Category>[]>;

    abstract createExpense(input: CreateExpenseInput): Expense | Promise<Expense>;

    abstract updateExpense(input: UpdateExpenseInput): Expense | Promise<Expense>;

    abstract removeExpense(id: string): Nullable<Expense> | Promise<Nullable<Expense>>;
}

export class Expense {
    id?: Nullable<string>;
    title?: Nullable<string>;
    amount?: Nullable<number>;
    date?: Nullable<Date>;
    categoryId?: Nullable<string>;
    category?: Nullable<Category>;
    notes?: Nullable<string>;
    user?: Nullable<User>;
    userId?: Nullable<string>;
}

export class Category {
    id?: Nullable<string>;
    name?: Nullable<string>;
}

export class ExpensesReportResponse {
    amount: number;
    category: string;
    userName: string;
    date: Date;
}

type Nullable<T> = T | null;
