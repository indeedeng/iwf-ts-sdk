import {
    CommandResults,
    Communication,
    CommunicationMethodDef,
    Context,
    ObjectWorkflow,
    Persistence,
    StateDecision,
    StateDef,
    StateMovement,
    WorkflowState,
} from "../../../iwf";
import { RPC_OUTPUT, RpcWorkflowState2 } from "./rpc-workflow";

export const IDLE_INTERNAL_CHANNEL = "ideal-internal-channel";
export const IDLE_SIGNAL_CHANNEL = "ideal-signal-channel";

/** Ports Java's package-private `DeadEndState`: goes nowhere, leaving the workflow idle. */
class DeadEndState implements WorkflowState {
    public get stateId(): string {
        return "DeadEndState";
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.deadEnd();
    }
}

/** Ports Java's `DeadEndStateWorkflow`: an idle workflow used to inspect channel sizes over RPC. */
export class DeadEndStateWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "DeadEndStateWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new DeadEndState()), StateDef.nonStartingState(new RpcWorkflowState2())];
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.internalChannelDef(IDLE_INTERNAL_CHANNEL),
            CommunicationMethodDef.signalChannelDef(IDLE_SIGNAL_CHANNEL),

            CommunicationMethodDef.rpcMethodDef(
                "getSignalChannelSize",
                (_context, _input, _persistence, communication) =>
                    communication.getSignalChannelSize(IDLE_SIGNAL_CHANNEL),
            ),

            CommunicationMethodDef.rpcMethodDef(
                "sendAndGetInternalChannelSize",
                (_context, _input, _persistence, communication) => {
                    communication.publishInternalChannel(IDLE_INTERNAL_CHANNEL);
                    return communication.getInternalChannelSize(IDLE_INTERNAL_CHANNEL);
                },
            ),

            CommunicationMethodDef.rpcMethodDef("testRpcFunc1", (context, _input, _persistence, communication) => {
                if (!context.workflowId || !context.workflowRunId || context.workflowType !== "DeadEndStateWorkflow") {
                    throw new Error("invalid context");
                }
                communication.triggerStateMovements(StateMovement.create("RpcWorkflowState2"));
                return RPC_OUTPUT;
            }),
        ];
    }
}
