import { dlopen, FFIType } from "bun:ffi";

const path = "/lib64/libc.so.6";

export const fsExt = dlopen(path, {
  flock: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
});

const LOCK_EX = 2 as const;
const LOCK_NB = 4 as const;
const LOCK_SH = 1 as const;
const LOCK_UN = 8 as const;

export const flockConstants = { LOCK_SH, LOCK_EX, LOCK_NB, LOCK_UN } as const;
export type FlockFlag = 2 | 4 | 1 | 8;

export const fileOpenModes = {
  READ: "r",
  WRITE: "w",
  APPEND: "a",
  READ_PLUS: "r+",
};

export function flock(fd: number, flag: FlockFlag): number {
  return fsExt.symbols.flock(fd, flag);
}
