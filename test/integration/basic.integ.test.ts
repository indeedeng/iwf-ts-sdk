import { ErrorSubStatus, IDReusePolicy, IwfHttpError } from "../../iwf";
import { BasicWorkflow } from "../src/basic/basic-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's BasicTest. Requires a running iWF server (scripts/integ/docker-compose.yml);
// run with `npm run test:integ`.
describe("BasicTest", () => {
    useWorker();

    const workflow = new BasicWorkflow();

    it("testBasicWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("basic-test-id");
        const input = 0;
        const startOptions = { workflowIdReusePolicy: IDReusePolicy.DisallowReuse };

        await client.startWorkflow(workflow, workflowId, 10, input, startOptions);

        // Each of the two states adds 1.
        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(input + 2);

        // Starting the same workflow id again must fail under DISALLOW_REUSE.
        const secondStart = client.startWorkflow(workflow, workflowId, 10, input, startOptions);
        await expect(secondStart).rejects.toThrow(IwfHttpError);
        const error = (await secondStart.catch((e) => e)) as IwfHttpError;
        expect(error.isWorkflowAlreadyStarted).toBe(true);
        expect(error.subStatus).toBe(ErrorSubStatus.WorkflowAlreadyStartedSubStatus);
        expect(error.statusCode).toBe(400);
    });
});
