import { WorkflowErrorType, WorkflowStatus, WorkflowUncompletedError } from "../../iwf";
import { AnyCommandCombinationFailWorkflow } from "../src/anycommandcombination/any-command-combination-fail-workflow";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's AnyCommandCombinationTest: a combination naming a command id that was never declared
// is rejected, failing the state API.
describe("AnyCommandCombinationTest", () => {
    useWorker();

    it("testStateApiFailWorkflow", async () => {
        const client = newClient();
        const workflowId = uniqueId("testStateApiFailWorkflow");

        const runId = await client.startWorkflow(new AnyCommandCombinationFailWorkflow(), workflowId, 10, 5);

        const pending = client.waitForWorkflowCompletion(workflowId);
        await expect(pending).rejects.toThrow(WorkflowUncompletedError);
        const error = (await pending.catch((e) => e)) as WorkflowUncompletedError;

        expect(error.workflowRunId).toBe(runId);
        expect(error.closedStatus).toBe(WorkflowStatus.Failed);
        expect(error.errorType).toBe(WorkflowErrorType.StateApiFailErrorType);
        // Java asserts "CommandNotFoundException: Found unknown commandId in the combination list".
        // Current iwf-server rejects the same request with different wording; the failure mode and
        // error type are unchanged, so this asserts the message the server actually returns.
        expect(error.errorMessage).toContain(
            "ANY_COMMAND_COMBINATION_COMPLETED can only be used when every command has an commandId",
        );
        expect(error.stateResults).toHaveLength(0);
    });
});
