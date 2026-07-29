import { ConditionalCompleteWorkflow, SIGNAL_CHANNEL_NAME } from "../src/conditional/conditional-complete-workflow";
import { newClient, sleep, uniqueId, useWorker } from "./helpers";

// Ports Java's ConditionalCompleteTest: the state loops back into itself until the channel it is
// watching is empty, so three messages produce a counter of 3.
describe("ConditionalCompleteTest", () => {
    useWorker();

    const runCompleteIfChannelEmpty = async (useSignal: boolean): Promise<void> => {
        const client = newClient();
        const workflow = new ConditionalCompleteWorkflow();
        const workflowId = uniqueId(`testCompleteIf${useSignal ? "Signal" : "Internal"}ChannelEmpty`);

        await client.startWorkflow(workflow, workflowId, 10, useSignal);
        await sleep(1000);

        for (let i = 0; i < 3; i++) {
            if (useSignal) {
                await client.signalWorkflow(workflowId, SIGNAL_CHANNEL_NAME);
            } else {
                await client.invokeRpc(workflow, workflowId, "publishToInternalChannel");
            }
            if (i === 0) {
                // Let the workflow reach execute before the next message arrives.
                await sleep(1000);
            }
        }

        const output = await client.getSimpleWorkflowResult<number>(workflowId);
        expect(output).toBe(3);
    };

    it("testCompleteIfInternalChannelEmpty", async () => {
        await runCompleteIfChannelEmpty(false);
    });

    it("testCompleteIfSignalChannelEmpty", async () => {
        await runCompleteIfChannelEmpty(true);
    });
});
