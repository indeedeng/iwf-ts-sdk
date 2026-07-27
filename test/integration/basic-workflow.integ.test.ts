import type { Server } from "http";
import { Client, Registry } from "../../iwf";
import { BasicWorkflow } from "../src/basic-workflow";
import { DEFAULT_WORKER_PORT, startWorker } from "../index";

// Requires a running iWF server (see scripts/integ/docker-compose.yml). Run with `npm run test:integ`.
const WORKER_PORT = DEFAULT_WORKER_PORT;
const SERVER_URL = process.env.IWF_SERVER_URL ?? "http://localhost:8801";
const WORKER_URL = process.env.IWF_WORKER_URL ?? `http://localhost:${WORKER_PORT}`;

describe("BasicWorkflow integration", () => {
    let worker: Server;

    beforeAll(async () => {
        worker = await startWorker(WORKER_PORT);
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            worker.close((err) => (err ? reject(err) : resolve()));
        });
    });

    it("runs a two-state workflow end to end", async () => {
        const registry = new Registry();
        const workflow = new BasicWorkflow();
        registry.addWorkflow(workflow);

        const client = new Client(registry, {
            serverUrl: SERVER_URL,
            workerUrl: WORKER_URL,
        });

        const workflowId = `basic-${Date.now()}`;
        const runId = await client.startWorkflow(workflow, workflowId, 3600, "start");
        expect(runId).toBeTruthy();

        // state1 appends " state1", state2 appends " state2" and completes gracefully.
        const result = await client.getSimpleWorkflowResult<string>(workflowId);
        expect(result).toBe("start state1 state2");
    });
});
