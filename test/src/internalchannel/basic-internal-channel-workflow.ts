import {
    ChannelRequestStatus,
    CommandRequest,
    CommandRequestBuilder,
    CommandResults,
    CommandWaitingType,
    Communication,
    CommunicationMethodDef,
    Context,
    InternalChannelCommand,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    StateMovement,
    WorkflowState,
} from "../../../iwf";

export const INTER_STATE_CHANNEL_NAME_1 = "test-inter-state-channel-1";
export const INTER_STATE_CHANNEL_NAME_2 = "test-inter-state-channel-2";
export const INTER_STATE_CHANNEL_PREFIX_1 = "test-inter-state-channel-prefix-1-";

/** Ports Java's `BasicInternalChannelWorkflowState0`: fans out to both other states. */
class BasicInternalChannelWorkflowState0 implements WorkflowState {
    public get stateId(): string {
        return "BasicInternalChannelWorkflowState0";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.multiNextStates(
            StateMovement.create("BasicInternalChannelWorkflowState1", input),
            StateMovement.create("BasicInternalChannelWorkflowState2", input),
        );
    }
}

/** Ports Java's `BasicInternalChannelWorkflowState1`: waits on a command combination. */
class BasicInternalChannelWorkflowState1 implements WorkflowState {
    public static readonly COMMAND_ID = "test-cmd-id";
    public static readonly COMMAND_ID_2 = "test-cmd-id-2";

    public get stateId(): string {
        return "BasicInternalChannelWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return new CommandRequestBuilder()
            .addAllCommands([
                InternalChannelCommand.byName(
                    INTER_STATE_CHANNEL_NAME_1,
                    BasicInternalChannelWorkflowState1.COMMAND_ID,
                ),
                InternalChannelCommand.byName(
                    INTER_STATE_CHANNEL_NAME_2,
                    BasicInternalChannelWorkflowState1.COMMAND_ID,
                ),
                InternalChannelCommand.byName(
                    `${INTER_STATE_CHANNEL_PREFIX_1}1`,
                    BasicInternalChannelWorkflowState1.COMMAND_ID_2,
                ),
            ])
            .addCommandCombination({
                commandIds: [
                    BasicInternalChannelWorkflowState1.COMMAND_ID,
                    BasicInternalChannelWorkflowState1.COMMAND_ID_2,
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
        const results = commandResults.internalChannelResults;
        const output = (input as number) + (results[0].value as number);

        if (results[1].status !== ChannelRequestStatus.Waiting) {
            throw new Error("the second command should be waiting");
        }
        if (results[2].status !== ChannelRequestStatus.Received) {
            throw new Error("the third command should be received");
        }
        return StateDecision.gracefulCompleteWorkflow(output);
    }
}

/** Ports Java's `BasicInternalChannelWorkflowState2`: publishes what state1 is waiting for. */
class BasicInternalChannelWorkflowState2 implements WorkflowState {
    public get stateId(): string {
        return "BasicInternalChannelWorkflowState2";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        communication: Communication,
    ): CommandRequest {
        communication.publishInternalChannel(INTER_STATE_CHANNEL_NAME_1, 2);
        communication.publishInternalChannel(`${INTER_STATE_CHANNEL_PREFIX_1}1`, 3);
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.gracefulCompleteWorkflow();
    }
}

/** Ports Java's `BasicInternalChannelWorkflow`. */
export class BasicInternalChannelWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "BasicInternalChannelWorkflow";
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.internalChannelDef(INTER_STATE_CHANNEL_NAME_1),
            CommunicationMethodDef.internalChannelDef(INTER_STATE_CHANNEL_NAME_2),
            CommunicationMethodDef.internalChannelPrefixDef(INTER_STATE_CHANNEL_PREFIX_1),
        ];
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new BasicInternalChannelWorkflowState0()),
            StateDef.nonStartingState(new BasicInternalChannelWorkflowState1()),
            StateDef.nonStartingState(new BasicInternalChannelWorkflowState2()),
        ];
    }
}

export const WAITING_INTER_STATE_CHANNEL_NAME = "test-inter-state-channel-1";

/** Ports Java's `WaitingInternalChannelWorkflowState`: waits for two messages on one channel. */
class WaitingInternalChannelWorkflowState implements WorkflowState {
    public get stateId(): string {
        return "WaitingInternalChannelWorkflowState";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.forAllCommandCompleted(
            InternalChannelCommand.byName(WAITING_INTER_STATE_CHANNEL_NAME),
            InternalChannelCommand.byName(WAITING_INTER_STATE_CHANNEL_NAME),
        );
    }

    public execute(
        _context: Context,
        input: unknown,
        commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const [first, second] = commandResults.internalChannelResults;
        const output = (input as number) + (first.value as number) + (second.value as number);
        return StateDecision.gracefulCompleteWorkflow(output);
    }
}

/** Ports Java's `WaitingInternalChannelWorkflow`. */
export class WaitingInternalChannelWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "WaitingInternalChannelWorkflow";
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [CommunicationMethodDef.internalChannelDef(WAITING_INTER_STATE_CHANNEL_NAME)];
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new WaitingInternalChannelWorkflowState())];
    }
}
