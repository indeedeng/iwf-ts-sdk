import { IDReusePolicy } from "../../iwf";
import { StateOptionsWorkflow } from "../src/stateoptions/state-options-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's StateOptionsTest: the states assert their own per-phase data-attribute loading
// policies from inside the worker, so completing at all is the assertion.
describe("StateOptionsTest", () => {
    useWorker();

    it("testStateOptionsWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("state-options-test-id");

        await client.startWorkflow(new StateOptionsWorkflow(), workflowId, 10, undefined, {
            workflowIdReusePolicy: IDReusePolicy.DisallowReuse,
        });

        const output = await client.getSimpleWorkflowResult<string>(workflowId);
        expect(output).toBe("success");
    });
});
