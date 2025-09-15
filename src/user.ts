import { deserializeInt, INT_SIZE, serializeInt } from "./primitiveEncoders";
import {
    type Transaction,
    deserializeTransactions,
    serializeTransactions,
    TRANSACTION_BYTE_SIZE,
} from "./transaction";
import z from "zod";

export const IdSchema = z.int();
export function parseId(id: unknown): number {
    return IdSchema.parse(id);
}

export class LimitExceedError extends Error { }

export const MAX_TRANSACTIONS = 10 as const;
// 710 bytes
export interface User {
    id: number; // 4 bytes
    limit: number; // 4 bytes
    total: number; // 4 bytes
    nTransactions: number; // 4 bytes
    oldestTransaction: number; // 4 bytes
    // 10 * Transation bytes = 690
    transactions: Transaction[];
}

export function serializeUser(user: User): Buffer {
    const serializedId = serializeInt(user.id);
    const serializedLimit = serializeInt(user.limit);
    const serializedTotal = serializeInt(user.total);
    const serializedNTransactions = serializeInt(user.nTransactions);
    const oldestTransaction = serializeInt(user.oldestTransaction);
    const serializedTransactions = serializeTransactions(user.transactions);

    const serializedUser = Buffer.concat([
        serializedId,
        serializedLimit,
        serializedTotal,
        serializedNTransactions,
        oldestTransaction,
        serializedTransactions,
    ]);
    return serializedUser;
}

export function deserializeUser(serializedUser: Buffer): User {
    let byteStart = 0;

    const id = deserializeInt(serializedUser.subarray(byteStart, byteStart + INT_SIZE));
    byteStart += INT_SIZE;

    const limit = deserializeInt(serializedUser.subarray(byteStart, byteStart + INT_SIZE));
    byteStart += INT_SIZE;

    const total = deserializeInt(serializedUser.subarray(byteStart, byteStart + INT_SIZE));
    byteStart += INT_SIZE;

    const nTransactions = deserializeInt(serializedUser.subarray(byteStart, byteStart + INT_SIZE));
    byteStart += INT_SIZE;

    const oldestTransaction = deserializeInt(serializedUser.subarray(byteStart, byteStart + INT_SIZE));
    byteStart += INT_SIZE;

    const transactions = deserializeTransactions(serializedUser.subarray(byteStart, byteStart + TRANSACTION_BYTE_SIZE * MAX_TRANSACTIONS));

    return {
        id,
        limit,
        total,
        nTransactions,
        oldestTransaction,
        transactions,
    };
}

export function addTransaction(user: User, transaction: Transaction): void {
    const valor = transaction.tipo === 'c' ? transaction.valor : -transaction.valor;
    user.total += valor;
    if (-user.total > user.limit) {
        throw new LimitExceedError(`The value of ${transaction.valor} exceeds the user limit of ${user.limit}`);
    }
    if (user.nTransactions === 10) {
        user.transactions[user.oldestTransaction] = transaction;
        user.oldestTransaction = (user.oldestTransaction + 1) % MAX_TRANSACTIONS;
        return;
    }

    user.transactions[user.nTransactions] = transaction;
    user.nTransactions++;
}
