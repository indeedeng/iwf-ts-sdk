import {
    CommandRequest,
    CommandRequestBuilder,
    CommandResults,
    CommandWaitingType,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    SignalCommand,
    StateDecision,
    StateDef,
    TimerCommand,
    WorkflowState,
    WorkflowStateOptions,
} from "../../../iwf";
import { SIGNAL_CHANNEL_NAME_1, SIGNAL_CHANNEL_NAME_2, SIGNAL_CHANNEL_NAME_3 } from "../signal/basic-signal-workflow";

/**
 * Ports Java's `InvalidAnyCommandCombinationWorkflowState`: the combination names a timer command id
 * that is declared, but a signal id (`test-signal-3`) that is not among the commands, so the server
 * rejects the request with a CommandNotFoundException.
 *
 * Built via CommandRequestBuilder rather than `CommandRequest.forAnyCommandCombinationCompleted`,
 * deliberately: that factory validates combination ids client-side (a TS-only guardrail) and would
 * throw at definition time, whereas Java has no such check. Going through the builder lets the invalid
 * combination reach the server, reproducing Java's server-side CommandNotFoundException.
 */
class InvalidAnyCommandCombinationWorkflowState implements WorkflowState {
    public static readonly SIGNAL_COMMAND_ID_1 = "test-signal-1";
    public static readonly SIGNAL_COMMAND_ID_2 = "test-signal-2";
    public static readonly SIGNAL_COMMAND_ID_3 = "test-signal-3";
    public static readonly TIMER_COMMAND_ID = "test-timer-id";

    public get stateId(): string {
        return "InvalidAnyCommandCombinationWorkflowState";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return new CommandRequestBuilder()
            .addAllCommands([
                SignalCommand.byName(
                    SIGNAL_CHANNEL_NAME_1,
                    InvalidAnyCommandCombinationWorkflowState.SIGNAL_COMMAND_ID_1,
                ),
                SignalCommand.byName(
                    SIGNAL_CHANNEL_NAME_2,
                    InvalidAnyCommandCombinationWorkflowState.SIGNAL_COMMAND_ID_1,
                ),
                SignalCommand.byName(
                    SIGNAL_CHANNEL_NAME_3,
                    InvalidAnyCommandCombinationWorkflowState.SIGNAL_COMMAND_ID_2,
                ),
                TimerCommand.byDuration(365 * 24 * 60 * 60, InvalidAnyCommandCombinationWorkflowState.TIMER_COMMAND_ID),
            ])
            .addCommandCombination({
                commandIds: [
                    InvalidAnyCommandCombinationWorkflowState.SIGNAL_COMMAND_ID_1,
                    // Never declared above — this is what makes the combination invalid.
                    InvalidAnyCommandCombinationWorkflowState.SIGNAL_COMMAND_ID_3,
                    InvalidAnyCommandCombinationWorkflowState.TIMER_COMMAND_ID,
                ],
            })
            .setCommandWaitingType(CommandWaitingType.AnyCombinationCompleted)
            .build();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        throw new Error("test api failing");
    }

    public getStateOptions(): WorkflowStateOptions {
        const options = new WorkflowStateOptions();
        options.executeApiRetryPolicy = { maximumAttempts: 1, backoffCoefficient: 2 };
        return options;
    }
}

/** Ports Java's `AnyCommandCombinationFailWorkflow`. */
export class AnyCommandCombinationFailWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "AnyCommandCombinationFailWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new InvalidAnyCommandCombinationWorkflowState())];
    }
}
