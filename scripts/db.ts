import type { Transaction } from "./transaction";
import {
  type User,
  addTransaction,
  deserializeUser,
  serializeUser,
} from "./user";
import { openSync, readFileSync, writeFileSync } from "fs";
import { flockConstants, fileOpenModes, flock } from "../src/fs-ext";

function userPath(id: number): string {
  return `users/user${id}`;
}

// Call when resetting/creating user
// Otherwise call update functions
export async function writeUser(user: User): Promise<void> {
  const filePath = userPath(user.id);
  const fd = openSync(filePath, fileOpenModes.WRITE);

  flock(fd, flockConstants.LOCK_EX);
  writeFileSync(filePath, serializeUser(user));
  flock(fd, flockConstants.LOCK_UN);
}

export async function readUser(id: number): Promise<User> {
  const filePath = userPath(id);
  const fd = openSync(filePath, "r");

  flock(fd, flockConstants.LOCK_SH);
  const serializedUser = readFileSync(filePath);
  flock(fd, flockConstants.LOCK_UN);

  const user = deserializeUser(serializedUser);
  return user;
}

export function updateUserWithTransaction(
  id: number,
  transaction: Transaction
): User {
  const filePath = userPath(id);
  const fd = openSync(filePath, fileOpenModes.READ);
  flock(fd, flockConstants.LOCK_EX);

  const fileUser = readFileSync(filePath);
  const user = deserializeUser(fileUser);
  addTransaction(user, transaction);
  const serializedUser = serializeUser(user);
  writeFileSync(filePath, serializedUser);

  flock(fd, flockConstants.LOCK_UN);

  return user;
}
