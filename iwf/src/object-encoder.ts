import { EncodedObject } from "../../gen/iwfidl";

/**
 * ObjectEncoder encodes/decodes native values to/from the wire {@link EncodedObject} form.
 * Implement this to customize serialization (e.g. compression, encryption, a different format).
 * The {@link encodingType} is round-tripped by the server back to the same worker, so any
 * consistent value works as long as encode/decode agree.
 */
export interface ObjectEncoder {
    /** A stable identifier for the encoding, stored on each EncodedObject. */
    readonly encodingType: string;

    /** Encode a native value. Returns undefined when the value is undefined. */
    encode(value: unknown): EncodedObject | undefined;

    /** Decode a wire object back to a native value. Returns undefined when the object is empty. */
    decode<T = unknown>(encoded: EncodedObject | undefined): T | undefined;
}

/**
 * Default JSON-based ObjectEncoder. Uses JSON.stringify/JSON.parse and tags payloads as "json".
 */
export class JsonObjectEncoder implements ObjectEncoder {
    public readonly encodingType = "json";

    public encode(value: unknown): EncodedObject | undefined {
        if (value === undefined) {
            return undefined;
        }
        return {
            encoding: this.encodingType,
            data: JSON.stringify(value),
        };
    }

    public decode<T = unknown>(encoded: EncodedObject | undefined): T | undefined {
        if (encoded === undefined || encoded.data === undefined) {
            return undefined;
        }
        return JSON.parse(encoded.data) as T;
    }
}

/** The default ObjectEncoder used when none is supplied via ClientOptions/WorkerOptions. */
export const defaultObjectEncoder: ObjectEncoder = new JsonObjectEncoder();
