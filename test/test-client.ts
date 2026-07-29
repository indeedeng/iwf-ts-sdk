import { Client } from "../iwf";
import { BasicWorkflow } from "./src/basic/basic-workflow";
import { createRegistry } from "./workflows";

async function main(): Promise<void> {
    const workflow = new BasicWorkflow();

    const client = new Client(createRegistry(), {
        serverUrl: "http://localhost:8801",
        workerUrl: "http://localhost:8802",
    });

    const workflowId = `basic-${Date.now()}`;
    const runId = await client.startWorkflow(workflow, workflowId, 3600, 1);
    console.log(`started workflow ${workflowId}, run ${runId}`);

    // Each of the two states adds 1, so this prints 3.
    const result = await client.getSimpleWorkflowResult<number>(workflowId);
    console.log(`result: ${result}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
