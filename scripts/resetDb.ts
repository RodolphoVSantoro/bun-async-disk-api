import { writeUser } from "./db";
import { defaultUser } from "./user";

const USER_INITIAL_LIMITS = [100000, 80000, 1000000, 10000000, 500000] as const;
let id = 1;
for (const initialLimit of USER_INITIAL_LIMITS) {
    writeUser(defaultUser({ id, limit: initialLimit }));
    id++;
}