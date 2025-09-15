import type { Transaction } from "./transaction";
import {
  type User,
  addTransaction,
  deserializeUser,
  serializeUser,
} from "./user";
import { openSync } from "fs";
import {
  flockConstants,
  writeFileAsync,
  readFileAsync,
  flockAsync,
  fileOpenModes,
} from "./fs-ext";

function userPath(id: number): string {
  return `users/user${id}`;
}

// Call when resetting/creating user
// Otherwise call update functions
export async function writeUser(user: User): Promise<void> {
  const filePath = userPath(user.id);
  const fd = openSync(filePath, fileOpenModes.WRITE);

  await flockAsync(fd, flockConstants.LOCK_EX);
  await writeFileAsync(fd, serializeUser(user));
  await flockAsync(fd, flockConstants.LOCK_UN);
}

export async function readUser(id: number): Promise<User> {
  const filePath = userPath(id);
  const fd = openSync(filePath, fileOpenModes.READ);

  await flockAsync(fd, flockConstants.LOCK_SH);
  const serializedUser = await readFileAsync(fd);
  await flockAsync(fd, flockConstants.LOCK_UN);

  const user = deserializeUser(serializedUser);
  return user;
}

export async function updateUserWithTransaction(
  id: number,
  transaction: Transaction
): Promise<User> {
  const filePath = userPath(id);
  const fd = openSync(filePath, fileOpenModes.READ);

  await flockAsync(fd, flockConstants.LOCK_EX);
  const fileUser = await readFileAsync(fd);
  const user = deserializeUser(fileUser);
  addTransaction(user, transaction);
  const serializedUser = serializeUser(user);
  const fdWrite = openSync(filePath, fileOpenModes.WRITE);
  await writeFileAsync(fdWrite, serializedUser);
  await flockAsync(fd, flockConstants.LOCK_UN);

  return user;
}
