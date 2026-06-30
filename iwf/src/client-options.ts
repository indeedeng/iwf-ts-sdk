import { ObjectEncoder, defaultObjectEncoder } from "./object-encoder";

/** Retry/backoff policy applied to iWF server API calls that fail with a server-side (5xx) error. */
export interface ServiceApiRetryConfig {
    /** Backoff before the first retry, in milliseconds. */
    initialIntervalMs?: number;
    /** Maximum backoff between retries, in milliseconds. */
    maxIntervalMs?: number;
    /** Total attempts including the first try (set to 1 to disable retries). */
    maximumAttempts?: number;
}

export interface ClientOptions {
    /** Base URL of the iWF server (e.g. http://localhost:8801). */
    serverUrl: string;
    /** URL of this worker service that the server calls back into (e.g. http://localhost:8802). */
    workerUrl: string;
    /** Encoder used to (de)serialize inputs, outputs, attributes, and signal/channel values. */
    objectEncoder?: ObjectEncoder;
    /** Max seconds a long-poll API (get-with-wait) waits per request. Defaults to 10. */
    longPollWaitTimeSeconds?: number;
    /** Extra HTTP headers sent on every request to the iWF server. */
    requestHeaders?: Record<string, string>;
    /** Retry policy for server-side (5xx) / connection failures. Defaults to {@link DEFAULT_SERVICE_API_RETRY_CONFIG}. */
    serviceApiRetryConfig?: ServiceApiRetryConfig;
}

export const DEFAULT_SERVER_URL = "http://localhost:8801";
export const DEFAULT_WORKER_URL = "http://localhost:8802";
/** Long-poll wait applied when {@link ClientOptions.longPollWaitTimeSeconds} is unset. */
export const DEFAULT_LONG_POLL_WAIT_SECONDS = 10;
/** Matches the Java SDK's default service-API retry policy. */
export const DEFAULT_SERVICE_API_RETRY_CONFIG: Required<ServiceApiRetryConfig> = {
    initialIntervalMs: 100,
    maxIntervalMs: 1000,
    maximumAttempts: 10,
};

/** Resolve the encoder for the given options, falling back to the default JSON encoder. */
export function resolveObjectEncoder(options: ClientOptions): ObjectEncoder {
    return options.objectEncoder ?? defaultObjectEncoder;
}

/** Resolve the long-poll wait, applying the default when unset (not just in the convenience factory). */
export function resolveLongPollWaitTimeSeconds(options: ClientOptions): number {
    return options.longPollWaitTimeSeconds ?? DEFAULT_LONG_POLL_WAIT_SECONDS;
}

/** Resolve the retry policy, filling in defaults for any unset field. */
export function resolveServiceApiRetryConfig(options: ClientOptions): Required<ServiceApiRetryConfig> {
    return { ...DEFAULT_SERVICE_API_RETRY_CONFIG, ...options.serviceApiRetryConfig };
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
