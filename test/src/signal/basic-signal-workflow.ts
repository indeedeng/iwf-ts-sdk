import {
    ChannelRequestStatus,
    CommandRequest,
    CommandRequestBuilder,
    CommandResults,
    CommandWaitingType,
    Communication,
    CommunicationMethodDef,
    Context,
    ObjectWorkflow,
    Persistence,
    SignalCommand,
    StateDecision,
    StateDef,
    TimerCommand,
    TimerStatus,
    WorkflowState,
} from "../../../iwf";

export const SIGNAL_CHANNEL_NAME_1 = "test-signal-1";
export const SIGNAL_CHANNEL_NAME_2 = "test-signal-2";
export const SIGNAL_CHANNEL_NAME_3 = "test-signal-3";
export const SIGNAL_CHANNEL_PREFIX_1 = "test-signal-prefix-1";

/** Ports Java's `BasicSignalWorkflowState1`: waits on either of two signals, adds the first value. */
export class BasicSignalWorkflowState1 implements WorkflowState {
    public static readonly COMMAND_ID = "test-signal-id";

    public get stateId(): string {
        return "BasicSignalWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.forAnyCommandCompleted(
            SignalCommand.byName(SIGNAL_CHANNEL_NAME_1, BasicSignalWorkflowState1.COMMAND_ID),
            SignalCommand.byName(SIGNAL_CHANNEL_NAME_2, BasicSignalWorkflowState1.COMMAND_ID),
        );
    }

    public execute(
        _context: Context,
        input: unknown,
        commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const first = commandResults.signalResults[0];
        const output = (input as number) + (first.value as number);
        if (commandResults.signalResults[1].status !== ChannelRequestStatus.Waiting) {
            throw new Error("the second signal should be waiting");
        }
        return StateDecision.singleNextState("BasicSignalWorkflowState2", output);
    }
}

/**
 * Ports Java's `BasicSignalWorkflowState2`: waits for any of one command combination across two
 * signal channels, a prefix-named channel, and a long timer.
 */
export class BasicSignalWorkflowState2 implements WorkflowState {
    public static readonly SIGNAL_COMMAND_ID_1 = "test-signal-1";
    public static readonly SIGNAL_COMMAND_ID_2 = "test-signal-2";
    public static readonly SIGNAL_COMMAND_ID_3 = "test-signal-3";
    public static readonly TIMER_COMMAND_ID = "test-timer-id";

    public get stateId(): string {
        return "BasicSignalWorkflowState2";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return new CommandRequestBuilder()
            .addAllCommands([
                SignalCommand.byName(SIGNAL_CHANNEL_NAME_1, BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_1),
                SignalCommand.byName(SIGNAL_CHANNEL_NAME_2, BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_1),
                SignalCommand.byName(SIGNAL_CHANNEL_NAME_3, BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_2),
                SignalCommand.byName(`${SIGNAL_CHANNEL_PREFIX_1}1`, BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_3),
                TimerCommand.byDuration(365 * 24 * 60 * 60, BasicSignalWorkflowState2.TIMER_COMMAND_ID),
            ])
            .addCommandCombination({
                commandIds: [
                    BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_1,
                    BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_3,
                    BasicSignalWorkflowState2.TIMER_COMMAND_ID,
                ],
            })
            .setCommandWaitingType(CommandWaitingType.AnyCombinationCompleted)
            .build();
    }

    public execute(
        _context: Context,
        input: unknown,
        commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const results = commandResults.signalResults;
        const output = (input as number) + (results[0].value as number);

        if (results[1].status !== ChannelRequestStatus.Waiting) {
            throw new Error("the second signal should be waiting");
        }
        if (
            results[2].status !== ChannelRequestStatus.Received ||
            results[2].commandId !== BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_2
        ) {
            throw new Error("the 3 signal should be received");
        }
        if (
            results[3].status !== ChannelRequestStatus.Received ||
            results[3].commandId !== BasicSignalWorkflowState2.SIGNAL_COMMAND_ID_3
        ) {
            throw new Error("the 4 signal created by prefix should be received");
        }
        if (commandResults.timerResults[0].status !== TimerStatus.Fired) {
            throw new Error("the timer should be fired");
        }

        return StateDecision.gracefulCompleteWorkflow(output);
    }
}

/** Ports Java's `BasicSignalWorkflow`. */
export class BasicSignalWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "BasicSignalWorkflow";
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.signalChannelDef(SIGNAL_CHANNEL_NAME_1),
            CommunicationMethodDef.signalChannelDef(SIGNAL_CHANNEL_NAME_2),
            CommunicationMethodDef.signalChannelDef(SIGNAL_CHANNEL_NAME_3),
            CommunicationMethodDef.signalChannelPrefixDef(SIGNAL_CHANNEL_PREFIX_1),
        ];
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new BasicSignalWorkflowState1()),
            StateDef.nonStartingState(new BasicSignalWorkflowState2()),
        ];
    }
}
