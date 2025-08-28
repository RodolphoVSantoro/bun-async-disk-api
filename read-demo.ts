import { openSync, readFileSync } from "fs";
import { fsExt, flockConstants } from "./fs-ext";
import { input } from "./input";

const fd = openSync("foo.txt", "r");

const result = fsExt.symbols.flock(fd, flockConstants.LOCK_SH);
if (result === 0) {
  console.log("Lock acquired.");
} else {
  console.error("Failed to acquire lock.");
}

const resultRead = readFileSync("foo.txt", "utf-8");
console.log({ resultRead });

console.log("Press Enter to unlock:");
await input();

const resultClose = fsExt.symbols.flock(fd, flockConstants.LOCK_UN);
if (resultClose === 0) {
  console.log("Lock closed.");
} else {
  console.error("Failed to close lock.");
}
