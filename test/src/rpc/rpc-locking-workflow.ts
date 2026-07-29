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
    PersistenceLoadingType,
    RpcHandler,
    SearchAttributeValueType,
    StateDecision,
    StateDef,
    StateMovement,
    WorkflowState,
} from "../../../iwf";
import { HARDCODED_STR, RPC_OUTPUT } from "./rpc-workflow";

export const RPC_INTERNAL_CHANNEL_NAME = "rpc-channel-1";
export const TEST_DATA_OBJECT_KEY = "data-obj-1";
export const TEST_SEARCH_ATTRIBUTE_KEYWORD = "CustomKeywordField";
export const TEST_SEARCH_ATTRIBUTE_INT = "CustomIntField";

/**
 * Stands in for Java's `private static int counter` on RpcLockingWorkflowState2. ResetTest reads and
 * resets it between the original run and the replayed one.
 */
let state2Counter = 0;

/** Reset the counter so the next run starts clean; returns the previous value, like Java. */
export function resetRpcLockingWorkflowState2Counter(): number {
    const old = state2Counter;
    state2Counter = 0;
    return old;
}

/** Ports Java's `RpcLockingWorkflowState2`: reports how many times it has executed. */
export class RpcLockingWorkflowState2 implements WorkflowState {
    public get stateId(): string {
        return "RpcLockingWorkflowState2";
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
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        state2Counter += 1;
        return StateDecision.gracefulCompleteWorkflow(`The execute method was executed ${state2Counter} times`);
    }
}

/** Ports Java's `RpcLockingWorkflowState1`: waits on the internal channel, then moves to state2. */
export class RpcLockingWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "RpcLockingWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.forAnyCommandCompleted(InternalChannelCommand.byName(RPC_INTERNAL_CHANNEL_NAME));
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.singleNextState("RpcLockingWorkflowState2");
    }
}

/** Both RPCs do the same work; only their data-attribute loading policy differs. */
const writeAndAdvance: RpcHandler = (context, _input, persistence, communication) => {
    if (!context.workflowId || !context.workflowRunId) {
        throw new Error("invalid context");
    }
    persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, HARDCODED_STR);
    persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, HARDCODED_STR);
    persistence.setSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT, RPC_OUTPUT);
    communication.publishInternalChannel(RPC_INTERNAL_CHANNEL_NAME);
    communication.triggerStateMovements(StateMovement.create("RpcLockingWorkflowState2"));
};

/**
 * Ports Java's `RpcLockingWorkflow`. The locking RPC is recorded in history as an update and the
 * non-locking one as a signal, which is what lets ResetTest exercise skipUpdateReapply against
 * skipSignalReapply.
 */
export class RpcLockingWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "RpcLockingWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [
            StateDef.startingState(new RpcLockingWorkflowState1()),
            StateDef.nonStartingState(new RpcLockingWorkflowState2()),
        ];
    }

    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.dataAttributeDef(TEST_DATA_OBJECT_KEY),
            PersistenceFieldDef.searchAttributeDef(TEST_SEARCH_ATTRIBUTE_INT, SearchAttributeValueType.Int),
            PersistenceFieldDef.searchAttributeDef(TEST_SEARCH_ATTRIBUTE_KEYWORD, SearchAttributeValueType.Keyword),
        ];
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.internalChannelDef(RPC_INTERNAL_CHANNEL_NAME),

            CommunicationMethodDef.rpcMethodDef("testRpcWithLocking", writeAndAdvance, {
                dataAttributesLoadingPolicy: {
                    persistenceLoadingType: PersistenceLoadingType.PartialWithExclusiveLock,
                    partialLoadingKeys: [TEST_DATA_OBJECT_KEY],
                },
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcWithoutLocking", writeAndAdvance),
        ];
    }
}
