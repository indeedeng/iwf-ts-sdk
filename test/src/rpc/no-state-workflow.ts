import {
    CommunicationMethodDef,
    Context,
    ObjectWorkflow,
    PersistenceFieldDef,
    PersistenceLoadingType,
    StateDef,
} from "../../../iwf";
import { RPC_OUTPUT } from "./rpc-workflow";

export const DA_COUNTER = "counter";

/**
 * Ports Java's `NoStateWorkflow`: no states at all, only RPCs. `increaseCounter` takes an exclusive
 * lock on the counter data attribute, which is what makes the 100-concurrent-call locking test
 * meaningful. (Java's Spring-injected constructor dependencies are unused by the tests and dropped.)
 */
export class NoStateWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "NoStateWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [];
    }

    getPersistenceSchema(): PersistenceFieldDef[] {
        return [PersistenceFieldDef.dataAttributeDef(DA_COUNTER)];
    }

    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.rpcMethodDef(
                "increaseCounter",
                (_context, _input, persistence) => {
                    const current = persistence.getDataAttribute<number>(DA_COUNTER) ?? 0;
                    persistence.setDataAttribute(DA_COUNTER, current + 1);
                    return "done";
                },
                {
                    // Java: PARTIAL_WITH_EXCLUSIVE_LOCK + partial-loading/locking keys of DA_COUNTER.
                    dataAttributesLoadingPolicy: {
                        persistenceLoadingType: PersistenceLoadingType.PartialWithExclusiveLock,
                        partialLoadingKeys: [DA_COUNTER],
                        lockingKeys: [DA_COUNTER],
                    },
                },
            ),

            CommunicationMethodDef.rpcMethodDef("testWrite", (_context, _input, persistence) => {
                persistence.setDataAttribute(DA_COUNTER, 123);
                return "done";
            }),

            CommunicationMethodDef.rpcMethodDef("getCounter", (_context, _input, persistence) =>
                persistence.getDataAttribute<number>(DA_COUNTER),
            ),

            CommunicationMethodDef.rpcMethodDef("testRpcFunc1", (context: Context) => {
                if (!context.workflowId || !context.workflowRunId) {
                    throw new Error("invalid context");
                }
                return RPC_OUTPUT;
            }),

            CommunicationMethodDef.rpcMethodDef("testRpcFunc1Error", () => {
                throw new Error("this is an error");
            }),
        ];
    }
}
