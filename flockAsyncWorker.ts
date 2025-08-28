import { dlopen, FFIType } from "bun:ffi";
import { parentPort } from "worker_threads";

const path = "/lib64/libc.so.6";

export const fsExt = dlopen(path, {
    flock: {
        args: [FFIType.i32, FFIType.i32],
        returns: FFIType.i32,
    },
});

parentPort!.on("message", ({ fd, operation }) => {
    const result = fsExt.symbols.flock(fd, operation);
    parentPort!.postMessage(result);
});
