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
    SearchAttributeValueType,
    StateDecision,
    StateDef,
    StateMovement,
    WorkflowState,
} from "../../../iwf";

export const INTERNAL_CHANNEL_NAME = "test-channel-1";
export const TEST_DATA_OBJECT_KEY = "data-obj-1";
export const TEST_SEARCH_ATTRIBUTE_KEYWORD = "CustomKeywordField";
export const TEST_SEARCH_ATTRIBUTE_INT = "CustomIntField";

/** Java's RpcTest.RPC_OUTPUT / HARDCODED_STR. */
export const RPC_OUTPUT = 100;
export const HARDCODED_STR = "random-string";

/**
 * Stands in for Java's `private static int counter` on RpcWorkflowState2. The worker and the tests
 * share one module registry (see helpers.useWorker), so this behaves like the Java static: the test
 * can reset it between cases and read what the worker incremented.
 */
let state2Counter = 0;

/** Reset the counter so the next test starts clean; returns the previous value, like Java. */
export function resetRpcWorkflowState2Counter(): number {
    const old = state2Counter;
    state2Counter = 0;
    return old;
}

/** Ports Java's `RpcWorkflowState2`: completes with the counter on its second execution. */
export class RpcWorkflowState2 implements WorkflowState {
    public get stateId(): string {
        return "RpcWorkflowState2";
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
        if (state2Counter === 2) {
            return StateDecision.gracefulCompleteWorkflow(state2Counter);
        }
        return StateDecision.gracefulCompleteWorkflow();
    }
}

/** Ports Java's `RpcWorkflowState1`: waits on the internal channel, then moves to state2. */
export class RpcWorkflowState1 implements WorkflowState {
    public get stateId(): string {
        return "RpcWorkflowState1";
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.forAnyCommandCompleted(InternalChannelCommand.byName(INTERNAL_CHANNEL_NAME));
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.singleNextState("RpcWorkflowState2", 0);
    }
}

/** Throws unless the context carries the workflow id and run id, like every Java RPC in this fixture. */
function requireValidContext(context: Context): void {
    if (!context.workflowId || !context.workflowRunId) {
        throw new Error("invalid context");
    }
}

/** Ports Java's `RpcWorkflow` and its @RPC methods. */
export class RpcWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "RpcWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new RpcWorkflowState1()), StateDef.nonStartingState(new RpcWorkflowState2())];
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
            CommunicationMethodDef.internalChannelDef(INTERNAL_CHANNEL_NAME),

            // Java declares this @RPC without a Persistence parameter, which makes it load nothing.
            // TS has no signature inference, so the LOAD_NONE policies are declared explicitly.
            CommunicationMethodDef.rpcMethodDef(
                "testRpcNoPersistence",
                (context, _input, _persistence, communication) => {
                    requireValidContext(context);
                    communication.publishInternalChannel(INTERNAL_CHANNEL_NAME);
                    communication.triggerStateMovements(StateMovement.create("RpcWorkflowState2"));
                },
                {
                    dataAttributesLoadingPolicy: { persistenceLoadingType: PersistenceLoadingType.None },
                    searchAttributesLoadingPolicy: { persistenceLoadingType: PersistenceLoadingType.None },
                },
            ),

            CommunicationMethodDef.rpcMethodDef("testRpcFunc1", (context, input, persistence, communication) => {
                requireValidContext(context);
                persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, null); // test setting to null
                persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, input);
                persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, input as string);
                persistence.setSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT, RPC_OUTPUT);
                communication.publishInternalChannel(INTERNAL_CHANNEL_NAME);
                communication.triggerStateMovements(StateMovement.create("RpcWorkflowState2"));
                return RPC_OUTPUT;
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcFunc0", (context, _input, persistence, communication) => {
                requireValidContext(context);
                persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, HARDCODED_STR);
                persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, HARDCODED_STR);
                persistence.setSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT, RPC_OUTPUT);
                communication.publishInternalChannel(INTERNAL_CHANNEL_NAME);
                communication.triggerStateMovements(StateMovement.create("RpcWorkflowState2"));
                return RPC_OUTPUT;
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcProc1", (context, input, persistence, communication) => {
                requireValidContext(context);
                persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, input);
                persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, input as string);
                persistence.setSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT, RPC_OUTPUT);
                communication.publishInternalChannel(INTERNAL_CHANNEL_NAME);
                communication.triggerStateMovements(StateMovement.create("RpcWorkflowState2"));
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcProc0", (context, _input, persistence, communication) => {
                requireValidContext(context);
                persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, HARDCODED_STR);
                persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, HARDCODED_STR);
                persistence.setSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT, RPC_OUTPUT);
                communication.publishInternalChannel(INTERNAL_CHANNEL_NAME);
                communication.triggerStateMovements(StateMovement.create("RpcWorkflowState2"));
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcFunc1Readonly", (context) => {
                requireValidContext(context);
                return RPC_OUTPUT;
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcSetDataAttribute", (context, input, persistence) => {
                requireValidContext(context);
                persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, input);
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcGetDataAttribute", (context, _input, persistence) => {
                requireValidContext(context);
                return persistence.getDataAttribute<string>(TEST_DATA_OBJECT_KEY);
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcSetKeyword", (context, input, persistence) => {
                requireValidContext(context);
                persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, input as string);
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcGetKeyword", (context, _input, persistence) => {
                requireValidContext(context);
                return persistence.getSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD);
            }),
        ];
    }
}
