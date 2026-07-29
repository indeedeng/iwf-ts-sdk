import { IDReusePolicy } from "../../iwf";
import { StateOptionsOverrideWorkflow } from "../src/stateoptionsoverride/state-options-override-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's StateOptionsOverrideTest: the per-movement options replace what the target state
// declares, so state2 proceeds to execute after its waitUntil throws instead of failing.
describe("StateOptionsOverrideTest", () => {
    useWorker();

    it("testStateOptionsOverrideWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("state-options-override-test-id");

        await client.startWorkflow(new StateOptionsOverrideWorkflow(), workflowId, 10, "input", {
            workflowIdReusePolicy: IDReusePolicy.DisallowReuse,
        });

        const output = await client.getSimpleWorkflowResult<string>(workflowId);
        expect(output).toBe("input_state1_start_state1_decide_state2_start_state2_decide");
    });
});
