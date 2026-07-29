import { IDReusePolicy } from "../../iwf";
import { SkipWaitUntilWorkflow } from "../src/basic/skip-wait-until-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's SkipWaitUntilTest: neither state declares a waitUntil, so both skip that phase.
describe("SkipWaitUntilTest", () => {
    useWorker();

    it("testSkipWaitUntil", async () => {
        const client = newClient();
        const workflowId = uniqueId("testSkipWaitUntil");
        const input = 0;

        await client.startWorkflow(new SkipWaitUntilWorkflow(), workflowId, 10, input, {
            workflowIdReusePolicy: IDReusePolicy.DisallowReuse,
            workflowConfigOverride: { continueAsNewThreshold: 1 },
        });

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(input + 2);
    });
});
