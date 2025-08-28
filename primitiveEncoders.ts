export const STRING_SIZE = 32;
export const CHAR_SIZE = 1;
export const INT_SIZE = 4;

const stringEncoder = new TextEncoder();

export function serializeInt(n: number): Buffer {
    const serializedInt = Buffer.alloc(4);
    serializedInt.writeInt32LE(n);
    return serializedInt;
}

export function deserializeInt(b: Buffer) {
    const deserializedInt = b.readInt32LE();
    return deserializedInt;
}

export function stringEncode(value: string) {
    return stringEncoder.encode(value);
}