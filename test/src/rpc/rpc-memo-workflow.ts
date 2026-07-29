import {
    CommunicationMethodDef,
    ObjectWorkflow,
    PersistenceFieldDef,
    PersistenceOptions,
    SearchAttributeValueType,
    StateDef,
} from "../../../iwf";
import {
    INTERNAL_CHANNEL_NAME,
    RpcWorkflowState1,
    RpcWorkflowState2,
    TEST_DATA_OBJECT_KEY,
    TEST_SEARCH_ATTRIBUTE_INT,
    TEST_SEARCH_ATTRIBUTE_KEYWORD,
    sharedRpcHandlers,
} from "./rpc-workflow";

/**
 * Ports Java's `RpcMemoWorkflow`: the same shape as RpcWorkflow but with `enableCaching`, so data
 * attributes are served from the workflow memo. It adds strong-consistency read variants that bypass
 * the cache. The RPC bodies are identical to RpcWorkflow's and are shared rather than duplicated.
 */
export class RpcMemoWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "RpcMemoWorkflow";
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

    getPersistenceOptions(): PersistenceOptions {
        return new PersistenceOptions(true);
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.internalChannelDef(INTERNAL_CHANNEL_NAME),

            CommunicationMethodDef.rpcMethodDef("testRpcFunc1", sharedRpcHandlers.testRpcFunc1),
            CommunicationMethodDef.rpcMethodDef("testRpcFunc0", sharedRpcHandlers.testRpcFunc0),
            CommunicationMethodDef.rpcMethodDef("testRpcProc1", sharedRpcHandlers.testRpcProc1),
            CommunicationMethodDef.rpcMethodDef("testRpcProc0", sharedRpcHandlers.testRpcProc0),
            CommunicationMethodDef.rpcMethodDef("testRpcFunc1Readonly", sharedRpcHandlers.testRpcFunc1Readonly),
            CommunicationMethodDef.rpcMethodDef("testRpcSetDataAttribute", sharedRpcHandlers.testRpcSetDataAttribute),
            CommunicationMethodDef.rpcMethodDef("testRpcGetDataAttribute", sharedRpcHandlers.testRpcGetDataAttribute),
            CommunicationMethodDef.rpcMethodDef("testRpcSetKeyword", sharedRpcHandlers.testRpcSetKeyword),
            CommunicationMethodDef.rpcMethodDef("testRpcGetKeyword", sharedRpcHandlers.testRpcGetKeyword),

            // Java marks these @RPC(bypassCachingForStrongConsistency = true).
            CommunicationMethodDef.rpcMethodDef(
                "testRpcGetDataAttributeStrongConsistent",
                sharedRpcHandlers.testRpcGetDataAttribute,
                { bypassCachingForStrongConsistency: true },
            ),
            CommunicationMethodDef.rpcMethodDef(
                "testRpcGetKeywordStrongConsistency",
                sharedRpcHandlers.testRpcGetKeyword,
                { bypassCachingForStrongConsistency: true },
            ),
        ];
    }
}
