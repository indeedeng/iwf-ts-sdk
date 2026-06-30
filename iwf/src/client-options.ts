import { ObjectEncoder, defaultObjectEncoder } from "./object-encoder";

export interface ClientOptions {
    /** Base URL of the iWF server (e.g. http://localhost:8801). */
    serverUrl: string;
    /** URL of this worker service that the server calls back into (e.g. http://localhost:8802). */
    workerUrl: string;
    /** Encoder used to (de)serialize inputs, outputs, attributes, and signal/channel values. */
    objectEncoder?: ObjectEncoder;
    /** Max seconds a long-poll API (get-with-wait) waits per request. Defaults to 10. */
    longPollWaitTimeSeconds?: number;
}

export const DEFAULT_SERVER_URL = "http://localhost:8801";
export const DEFAULT_WORKER_URL = "http://localhost:8802";

/** Resolve the encoder for the given options, falling back to the default JSON encoder. */
export function resolveObjectEncoder(options: ClientOptions): ObjectEncoder {
    return options.objectEncoder ?? defaultObjectEncoder;
}

/** Convenience defaults pointing at a locally-running server and worker. */
export function localDefaultClientOptions(): ClientOptions {
    return {
        serverUrl: DEFAULT_SERVER_URL,
        workerUrl: DEFAULT_WORKER_URL,
        objectEncoder: defaultObjectEncoder,
        longPollWaitTimeSeconds: 10,
    };
}
