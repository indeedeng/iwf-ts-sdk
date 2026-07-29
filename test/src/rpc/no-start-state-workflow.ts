import { CommunicationMethodDef, ObjectWorkflow, StateDef, StateMovement } from "../../../iwf";
import { RPC_OUTPUT, RpcWorkflowState2 } from "./rpc-workflow";

/**
 * Ports Java's `NoStartStateWorkflow`: it has a state, but no *starting* state, so nothing runs until
 * an RPC triggers a state movement.
 */
export class NoStartStateWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "NoStartStateWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.nonStartingState(new RpcWorkflowState2())];
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.rpcMethodDef("testRpcFunc1", (context, _input, _persistence, communication) => {
                if (!context.workflowId || !context.workflowRunId) {
                    throw new Error("invalid context");
                }
                communication.triggerStateMovements(StateMovement.create("RpcWorkflowState2"));
                return RPC_OUTPUT;
            }),
        ];
    }
}
