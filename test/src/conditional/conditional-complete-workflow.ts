import {
    CommandRequest,
    CommandResults,
    Communication,
    CommunicationMethodDef,
    Context,
    InternalChannelCommand,
    ObjectWorkflow,
    Persistence,
    PersistenceFieldDef,
    SignalCommand,
    StateDecision,
    StateDef,
    WorkflowState,
} from "../../../iwf";

export const SIGNAL_CHANNEL_NAME = "test-signal-channel";
export const INTERNAL_CHANNEL_NAME = "test-internal-channel";
export const DA_COUNTER = "counter";

/**
 * Ports Java's package-private `WorkflowState1`: counts its executions and then completes only once
 * the channel it is watching has drained, otherwise loops back into itself.
 */
class ConditionalCompleteWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "WorkflowState1";
    }

    public waitUntil(
        _context: Context,
        useSignal: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return useSignal
            ? CommandRequest.forAnyCommandCompleted(SignalCommand.byName(SIGNAL_CHANNEL_NAME))
            : CommandRequest.forAnyCommandCompleted(InternalChannelCommand.byName(INTERNAL_CHANNEL_NAME));
    }

    public async execute(
        context: Context,
        useSignal: unknown,
        _commandResults: CommandResults,
        persistence: Persistence,
        _communication: Communication,
    ): Promise<StateDecision> {
        const counter = (persistence.getDataAttribute<number>(DA_COUNTER) ?? 0) + 1;
        persistence.setDataAttribute(DA_COUNTER, counter);

        if (context.stateExecutionId === "WorkflowState1-1") {
            // Give the channel time to receive another message before deciding.
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        return useSignal
            ? StateDecision.forceCompleteIfSignalChannelEmptyOrElse(
                  SIGNAL_CHANNEL_NAME,
                  counter,
                  "WorkflowState1",
                  useSignal,
              )
            : StateDecision.forceCompleteIfInternalChannelEmptyOrElse(
                  INTERNAL_CHANNEL_NAME,
                  counter,
                  "WorkflowState1",
                  useSignal,
              );
    }
}

/** Ports Java's `ConditionalCompleteWorkflow`. */
export class ConditionalCompleteWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "ConditionalCompleteWorkflow";
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.signalChannelDef(SIGNAL_CHANNEL_NAME),
            CommunicationMethodDef.internalChannelDef(INTERNAL_CHANNEL_NAME),
            CommunicationMethodDef.rpcMethodDef(
                "publishToInternalChannel",
                (_context, _input, _persistence, communication) => {
                    communication.publishInternalChannel(INTERNAL_CHANNEL_NAME);
                },
            ),
        ];
    }

    getPersistenceSchema(): PersistenceFieldDef[] {
        return [PersistenceFieldDef.dataAttributeDef(DA_COUNTER)];
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new ConditionalCompleteWorkflowState1())];
    }
}
