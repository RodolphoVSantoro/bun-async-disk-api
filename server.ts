import moment from "moment";
import { parseId } from "./user";
import type { BunRequest } from "bun";
import {
    readUser,
    updateUserWithTransaction,
} from "./db";
import {
    getSaldoResponseArray,
    validateRequest,
    type Transaction,
} from "./transaction";

Bun.serve({
    port: 3000,
    routes: {
        "/clientes/:customerId/transacoes": async (req: BunRequest<"/clientes/:customerId/transacoes">) => {
            // if (req.method !== "POST") {
            //     return new Response("Method not allowed", { status: 405 });
            // }
            const body: unknown = await req.json();
            try {
                validateRequest(body);
            } catch (error: unknown) {
                console.error(error);
                return new Response("Bad Request", { status: 400 });
            }

            const { descricao, tipo, valor } = body;
            const realizada_em = moment().format("YYYY-MM-DDThh:mm:ss.msZ");
            const transaction: Transaction = {
                valor,
                descricao,
                tipo,
                realizada_em,
            }
            const customerId = parseId(parseInt(req.params.customerId));
            const user = await updateUserWithTransaction(customerId, transaction);
            const response = {
                limite: user.limit,
                saldo: user.total,
            };
            return Response.json(response);
        },
        "/clientes/:customerId/extrato": async (req: BunRequest<"/clientes/:customerId/extrato">) => {
            // if (req.method !== "GET") {
            //     return new Response("Method not allowed", { status: 405 });
            // }
            const customerId = parseInt(req.params.customerId);
            if (!(customerId > 0 && customerId < 6)) {
                return new Response("Bad request", { status: 400 });
            }
            const user = await readUser(customerId);
            const data_extrato = moment().format("YYYY-MM-DDThh:mm:ss.msZ");
            const ultimas_transacoes = getSaldoResponseArray(user);

            const response = {
                saldo: {
                    total: user.total,
                    limite: user.limit,
                    data_extrato,
                    ultimas_transacoes,
                }
            };
            return Response.json(response);
        }
    }
});
console.log("Server running on port 3000");
