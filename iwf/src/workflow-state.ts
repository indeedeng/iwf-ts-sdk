import { CommandRequest } from "./command-request";
import { CommandResults } from "./command-results";
import { Context } from "./context";
import { StateDecision } from "./state-decision";
import { Persistence } from "./persistence/persistence";
import { Communication } from "./communication/communication";
import { WorkflowStateOptions } from "./workflow-state-options";

/**
 * A single state in a workflow.
 *
 * - {@link stateId} uniquely identifies the state within its workflow.
 * - {@link waitUntil} (optional) sets up the commands to wait for before executing. Omit it
 *   entirely to skip the waitUntil phase and go straight to execute.
 * - {@link execute} runs the state's logic and returns the next {@link StateDecision}.
 *
 * The `input` argument is the decoded native value; cast it to the expected type.
 */
export interface WorkflowState {
    get stateId(): string;

    getStateOptions?(): WorkflowStateOptions | undefined;

    waitUntil?(
        context: Context,
        input: unknown,
        persistence: Persistence,
        communication: Communication,
    ): CommandRequest | Promise<CommandRequest>;

    execute(
        context: Context,
        input: unknown,
        commandResults: CommandResults,
        persistence: Persistence,
        communication: Communication,
    ): StateDecision | Promise<StateDecision>;
}

/** True when the state does not implement waitUntil and the waitUntil phase should be skipped. */
export function shouldSkipWaitUntil(state: WorkflowState): boolean {
    return typeof state.waitUntil !== "function";
}
