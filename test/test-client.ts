import { Client, Registry } from "../iwf";
import { BasicWorkflow } from "./src/basic-workflow";

async function main(): Promise<void> {
    const registry = new Registry();
    const workflow = new BasicWorkflow();
    registry.addWorkflow(workflow);

    const client = new Client(registry, {
        serverUrl: "http://localhost:8801",
        workerUrl: "http://localhost:8802",
    });

    const workflowId = `basic-${Date.now()}`;
    const runId = await client.startWorkflow(workflow, workflowId, 3600, "start");
    console.log(`started workflow ${workflowId}, run ${runId}`);

    const result = await client.getSimpleWorkflowResult<string>(workflowId);
    console.log(`result: ${result}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
