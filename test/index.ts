import express, { Request, Response } from "express";
import type { Server } from "http";
import { WorkerService } from "../iwf";
import { createRegistry } from "./workflows";

export const DEFAULT_WORKER_PORT = 8802;

// Wrap a worker handler so thrown errors become a worker error response the server understands.
// T is inferred from the bound handler's request type, so req.body arrives correctly typed.
function handle<T>(fn: (body: T) => Promise<unknown>) {
    return async (req: Request, res: Response) => {
        try {
            res.json(await fn(req.body));
        } catch (e) {
            res.status(WorkerService.ERROR_STATUS_CODE).json(WorkerService.toErrorResponse(e));
        }
    };
}

/** Build the iWF worker Express app with every test workflow registered. */
export function createWorkerApp(): express.Express {
    const worker = new WorkerService(createRegistry());

    const app = express();
    app.use(express.json());

    app.get("/", (_req, res) => {
        res.send("iWF TypeScript worker is running");
    });

    app.post(
        WorkerService.API_PATH_WORKFLOW_STATE_WAIT_UNTIL,
        handle(worker.handleWorkflowStateWaitUntil.bind(worker)),
    );
    app.post(
        WorkerService.API_PATH_WORKFLOW_STATE_EXECUTE,
        handle(worker.handleWorkflowStateExecute.bind(worker)),
    );
    app.post(
        WorkerService.API_PATH_WORKFLOW_WORKER_RPC,
        handle(worker.handleWorkflowWorkerRpc.bind(worker)),
    );

    return app;
}

/** Start the worker and resolve once it is listening. Returns the server so callers can close it. */
export function startWorker(port: number = DEFAULT_WORKER_PORT): Promise<Server> {
    return new Promise((resolve) => {
        // Listen on all interfaces so a dockerized iwf-server can reach the worker via the bridge gateway.
        const server = createWorkerApp().listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
            resolve(server);
        });
    });
}

// Allow running the worker standalone: `node dist/test/index.js`.
if (require.main === module) {
    startWorker();
}
