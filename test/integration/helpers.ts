import type { Server } from "http";
import { Client, ClientOptions } from "../../iwf";
import { DEFAULT_WORKER_PORT, startWorker } from "../index";
import { createRegistry } from "../workflows";

// These tests need a running iWF server — see scripts/integ/docker-compose.yml.
export const SERVER_URL = process.env.IWF_SERVER_URL ?? "http://localhost:8801";
export const WORKER_PORT = Number(process.env.IWF_WORKER_PORT ?? DEFAULT_WORKER_PORT);
export const WORKER_URL = process.env.IWF_WORKER_URL ?? `http://localhost:${WORKER_PORT}`;

/**
 * Run a worker for the current test file, shutting it down afterwards.
 *
 * Java runs a single worker for the whole suite (`TestSingletonWorkerService`) because its statics are
 * shared with the tests in one JVM. Jest's `globalSetup` runs in a different module registry than the
 * test files, so a worker started there would hold its *own* copies of the fixture modules — and the
 * module-level counters that stand in for Java's `static` fields would not be the ones a test reads.
 * Starting the worker per file keeps the worker and the test in one module registry, so those counters
 * behave like Java statics. `--runInBand` makes the shared port safe.
 */
export function useWorker(): void {
    let worker: Server;

    beforeAll(async () => {
        worker = await startWorker(WORKER_PORT);
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            worker.close((err) => (err ? reject(err) : resolve()));
        });
    });
}

/** A client wired to the local server and worker, with every test workflow registered. */
export function newClient(options?: Partial<ClientOptions>): Client {
    return new Client(createRegistry(), {
        serverUrl: SERVER_URL,
        workerUrl: WORKER_URL,
        ...options,
    });
}

let idSequence = 0;

/** A workflow id unique across runs and within a run, so reruns never collide on id-reuse policy. */
export function uniqueId(prefix: string): string {
    idSequence += 1;
    return `${prefix}-${Date.now()}-${idSequence}`;
}

export function sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
