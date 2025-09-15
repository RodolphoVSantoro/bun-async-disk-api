import type { Transaction } from "./transaction";
import {
  type User,
  addTransaction,
  deserializeUser,
  serializeUser,
} from "./user";
import { openSync, readFileSync, writeFileSync } from "fs";
import { flockConstants, fileOpenModes, flock } from "./fs-ext";

function userPath(id: number): string {
  return `users/user${id}`;
}

// Call when resetting/creating user
// Otherwise call update functions
export function writeUser(user: User): void {
  const filePath = userPath(user.id);
  const fd = openSync(filePath, fileOpenModes.WRITE);

  flock(fd, flockConstants.LOCK_EX);
  writeFileSync(fd, serializeUser(user));
  flock(fd, flockConstants.LOCK_UN);
}

export function readUser(id: number): User {
  const filePath = userPath(id);
  const fd = openSync(filePath, fileOpenModes.READ);

  flock(fd, flockConstants.LOCK_SH);
  const serializedUser = readFileSync(fd);
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
  const fileUser = readFileSync(fd);
  const user = deserializeUser(fileUser);
  try {
    addTransaction(user, transaction);
  } catch (e) {
    flock(fd, flockConstants.LOCK_UN);
    throw e;
  }
  const serializedUser = serializeUser(user);
  const fdWrite = openSync(filePath, fileOpenModes.WRITE);
  writeFileSync(fdWrite, serializedUser);
  flock(fd, flockConstants.LOCK_UN);

  return user;
}
