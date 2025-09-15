import { MAX_TRANSACTIONS, type User } from "./user";
import {
    CHAR_SIZE,
    deserializeInt,
    INT_SIZE,
    serializeInt,
    stringEncode,
    STRING_SIZE,
} from "./primitiveEncoders";
import z from "zod";

class TransactionKindError extends Error { }
class InvalidSizeArray extends Error { }

export function isTipoTransactionValid(value: unknown): asserts value is TipoTransaction {
    try {
        TipoSchema.parse(value);
    } catch (_) {
        throw new TransactionKindError(`Invalid transaction kind ${value}`);
    }
}

export const TRANSACTION_BYTE_SIZE = 69 as const;
export interface Transaction {
    valor: number; // 4 bytes
    tipo: TipoTransaction; // 1 byte
    descricao: string; // 32 bytes
    realizada_em: string; // 32 bytes
}

const TipoSchema = z.union([
    z.literal('c'),
    z.literal('d'),
]);
export type TipoTransaction = z.infer<typeof TipoSchema>;

export const TransactionRequestSchema = z.object({
    valor: z.number(),
    tipo: TipoSchema,
    descricao: z.string().max(32).min(1),
})
export type TransactionRequest = z.infer<typeof TransactionRequestSchema>;
export function validateRequest(body: unknown): asserts body is TransactionRequest {
    TransactionRequestSchema.parse(body);
}

function serializeTransaction(transaction: Transaction): Buffer {
    const serializedValor = serializeInt(transaction.valor);
    const serializedTipo = Buffer.from(transaction.tipo.slice(0, CHAR_SIZE));
    const serializedDescription = stringEncode(transaction.descricao.slice(0, STRING_SIZE).padEnd(STRING_SIZE, "\0"));
    const serializedDate = stringEncode(transaction.realizada_em.slice(0, STRING_SIZE).padEnd(STRING_SIZE, "\0"));

    const serializedTransaction = Buffer.concat([
        serializedValor,
        serializedTipo,
        serializedDescription,
        serializedDate
    ]);
    return serializedTransaction;
}

function trimZeroes(str: string) {
    const stringBeforeZeroes = str.split("\0");
    return stringBeforeZeroes[0] ?? "";
}

function deserializeTransaction(serializedTransaction: Buffer): Transaction {
    let byteStart = 0;

    const serializedValor = serializedTransaction.subarray(byteStart, INT_SIZE);
    byteStart += INT_SIZE;

    const serializedTipo = serializedTransaction.subarray(byteStart, byteStart + CHAR_SIZE);
    byteStart += CHAR_SIZE;

    const serializedDescription = serializedTransaction.subarray(byteStart, byteStart + STRING_SIZE);
    byteStart += STRING_SIZE;

    const serializedDate = serializedTransaction.subarray(byteStart, byteStart + STRING_SIZE);

    const valor = deserializeInt(serializedValor);
    const descricao = trimZeroes(serializedDescription.toString());
    const realizada_em = trimZeroes(serializedDate.toString());
    const tipo = serializedTipo.toString();

    isTipoTransactionValid(tipo);

    return {
        valor,
        tipo,
        descricao,
        realizada_em,
    }
}

export function serializeTransactions(transactions: Transaction[]): Buffer {
    if (transactions.length != MAX_TRANSACTIONS) {
        throw new InvalidSizeArray(`Transactions has length ${transactions.length}`);
    }
    const transactionBuffers: Buffer[] = [];
    for (let i = 0; i < MAX_TRANSACTIONS; i++) {
        const transactionBuffer = serializeTransaction(transactions[i]);
        transactionBuffers.push(transactionBuffer);
    }
    const serializedTransactions = Buffer.concat(transactionBuffers);
    return serializedTransactions;
}

export function deserializeTransactions(transactionsBuffer: Buffer) {
    const transactions: Transaction[] = [];
    for (let i = 0; i < MAX_TRANSACTIONS; i++) {
        const transactionStart = i * TRANSACTION_BYTE_SIZE;
        const transactionEnd = (i + 1) * TRANSACTION_BYTE_SIZE;

        const transactionBuffer = transactionsBuffer.subarray(transactionStart, transactionEnd);
        const transaction = deserializeTransaction(transactionBuffer);
        transactions.push(transaction);
    }
    return transactions;
}

export function getSaldoResponseArray(user: User): Transaction[] {
    const responseArray: Transaction[] = new Array(user.nTransactions);
    let i = user.oldestTransaction;
    i = (i - 1 + user.nTransactions) % user.nTransactions;
    for (let j = 0; j < user.nTransactions; j++) {
        responseArray[j] = user.transactions[i];
        i = (i - 1 + user.nTransactions) % user.nTransactions;
    }
    return responseArray;
}
