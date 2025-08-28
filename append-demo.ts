import { appendFileSync, openSync } from "fs";
import { fsExt, flockConstants } from "./fs-ext";
import { input } from "./input";

const fd = openSync("foo.txt", "w");

const result = fsExt.symbols.flock(fd, flockConstants.LOCK_EX);
if (result === 0) {
  console.log("Lock acquired.");
} else {
  console.error("Failed to acquire lock.");
}

const text = await input();
appendFileSync("foo.txt", text);

const resultClose = fsExt.symbols.flock(fd, flockConstants.LOCK_UN);
if (resultClose === 0) {
  console.log("Lock closed.");
} else {
  console.error("Failed to close lock.");
}
