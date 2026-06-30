import express, { Request, Response } from "express";
import { Registry, WorkerService } from "../iwf";
import { BasicWorkflow } from "./src/basic-workflow";

const app = express();
const port = 8802;

const registry = new Registry();
registry.addWorkflow(new BasicWorkflow());
const worker = new WorkerService(registry);

app.use(express.json());

app.get("/", (_req, res) => {
    res.send("iWF TypeScript worker is running");
});

// Wrap a worker handler so thrown errors become a worker error response the server understands.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handle(fn: (body: any) => Promise<unknown>) {
    return async (req: Request, res: Response) => {
        try {
            res.json(await fn(req.body));
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            res.status(500).json({ detail: message, errorType: "WORKER_EXECUTION_ERROR" });
        }
    };
}

app.post(WorkerService.API_PATH_WORKFLOW_STATE_WAIT_UNTIL, handle((body) => worker.handleWorkflowStateWaitUntil(body)));
app.post(WorkerService.API_PATH_WORKFLOW_STATE_EXECUTE, handle((body) => worker.handleWorkflowStateExecute(body)));
app.post(WorkerService.API_PATH_WORKFLOW_WORKER_RPC, handle((body) => worker.handleWorkflowWorkerRpc(body)));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
