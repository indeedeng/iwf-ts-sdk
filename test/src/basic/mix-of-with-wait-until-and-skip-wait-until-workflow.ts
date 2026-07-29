import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    TimerCommand,
    WorkflowState,
    WorkflowStateOptions,
} from "../../../iwf";

/**
 * Ports Java's `MixOfWithWaitUntilAndSkipWaitUntilWorkflow.SHARED_STATE_OPTIONS`, shared by both
 * states exactly as the Java fixture shares its static. Safe to share here: `toIdl()` builds a fresh
 * object and `skipWaitUntil` is applied to that copy, so the declared instance is never mutated.
 */
export const SHARED_STATE_OPTIONS = ((): WorkflowStateOptions => {
    const options = new WorkflowStateOptions();
    options.executeApiRetryPolicy = { maximumAttempts: 3 };
    return options;
})();

/** Ports Java's `MixOfWithWaitUntilAndSkipWaitUntilState1`: no waitUntil, so the phase is skipped. */
export class MixOfWithWaitUntilAndSkipWaitUntilState1 implements WorkflowState {
    public get stateId(): string {
        return "MixOfWithWaitUntilAndSkipWaitUntilState1";
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const output = (input as number) + 1;
        return StateDecision.singleNextState("MixOfWithWaitUntilAndSkipWaitUntilState2", output);
    }

    public getStateOptions(): WorkflowStateOptions {
        return SHARED_STATE_OPTIONS;
    }
}

/** Ports Java's `MixOfWithWaitUntilAndSkipWaitUntilState2`: waits on a 1s timer, then completes. */
export class MixOfWithWaitUntilAndSkipWaitUntilState2 implements WorkflowState {
    public get stateId(): string {
        return "MixOfWithWaitUntilAndSkipWaitUntilState2";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.forAllCommandCompleted(TimerCommand.byDuration(1));
    }

    public execute(
        _context: Context,
        input: unknown,
        commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        // Java reads the first timer result's status here; the timer must have fired to get this far.
        // Note the TS field is `status`, not Java's `timerStatus`.
        if (commandResults.timerResults[0]?.status === undefined) {
            throw new Error("expected a timer command result");
        }
        const output = (input as number) + 1;
        return StateDecision.gracefulCompleteWorkflow(output);
    }

    public getStateOptions(): WorkflowStateOptions {
        return SHARED_STATE_OPTIONS;
    }
}

/** Ports Java's `MixOfWithWaitUntilAndSkipWaitUntilWorkflow`. */
export class MixOfWithWaitUntilAndSkipWaitUntilWorkflow implements ObjectWorkflow {
    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new MixOfWithWaitUntilAndSkipWaitUntilState1()),
            StateDef.nonStartingState(new MixOfWithWaitUntilAndSkipWaitUntilState2()),
        ];
    }

    getWorkflowType(): string {
        return "MixOfWithWaitUntilAndSkipWaitUntilWorkflow";
    }
}
