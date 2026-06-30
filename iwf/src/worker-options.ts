import { ObjectEncoder, defaultObjectEncoder } from "./object-encoder";

export interface WorkerOptions {
    /** Encoder used to (de)serialize state inputs/outputs, attributes, and channel values. */
    objectEncoder?: ObjectEncoder;
}

export function resolveWorkerObjectEncoder(options?: WorkerOptions): ObjectEncoder {
    return options?.objectEncoder ?? defaultObjectEncoder;
}
