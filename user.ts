import { INT_SIZE } from "./primitiveEncoders";
import {
    type Transaction,
    defaultTransaction,
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

function serializeInt(n: number): Buffer {
    const serializedInt = Buffer.alloc(INT_SIZE);
    serializedInt.writeInt32LE(n);
    return serializedInt;
}

function deserializeInt(b: Buffer) {
    const deserializedInt = b.readInt32LE();
    return deserializedInt;
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

export function defaultUser(options?: Partial<User>): User {
    let transactions: Transaction[] = [];
    for (let i = 0; i < MAX_TRANSACTIONS; i++) {
        transactions.push(defaultTransaction(options?.transactions?.[i]));
    }

    return {
        id: options?.id ?? 0,
        limit: options?.limit ?? 0,
        nTransactions: options?.nTransactions ?? 0,
        oldestTransaction: options?.oldestTransaction ?? 0,
        total: options?.total ?? 0,
        transactions,
    }
}

export function addTransaction(user: User, transaction: Transaction): void {
    addSaldo(user, transaction);
    if (user.nTransactions == 10) {
        user.transactions[user.oldestTransaction] = transaction;
        user.oldestTransaction = moveRightInTransactions(user.oldestTransaction);
        return;
    }

    user.transactions[user.nTransactions] = transaction;
    user.nTransactions++;
}

function addSaldo(user: User, transaction: Transaction) {
    if (transaction.tipo == 'd') {
        const newTotal = user.total - transaction.valor;
        if (-1 * newTotal > user.limit) {
            throw new LimitExceedError(`The value of ${transaction.valor} exceeds the user limit of ${user.limit}`);
        }
        user.total = newTotal;
        return;
    }
    // tipo == 'c'
    user.total += transaction.valor;
}

function moveRightInTransactions(index: number) {
    return (index + 1) % MAX_TRANSACTIONS;
}
