import { StateDecision } from "../src/state-decision";
import { StateDecisionMapper } from "../src/mapper/state-decision-mapper";
import { Client } from "../src/client";
import { defaultObjectEncoder } from "../src/object-encoder";
import { SearchAttributeValueType, WorkflowConditionalCloseType, WorkflowStartRequest, WorkflowStatus } from "../../gen/iwfidl";
import { UnregisteredClient } from "../src/unregistered-client";
import { WorkflowUncompletedError } from "../src/errors";
import { UnregisteredWorkflowOptionsBuilder } from "../src/unregistered-workflow-options";
import { localDefaultClientOptions } from "../src/client-options";
import { resetToBeginning } from "../src/workflow-operation-options";
import { Registry } from "../src/registry";
import { ObjectWorkflow } from "../src/object-workflow";
import { StateDef } from "../src/state-definition";
import { WorkflowState } from "../src/workflow-state";
import { CommunicationMethodDef } from "../src/communication/communication-method-def";
import { PersistenceOptions } from "../src/persistence/persistence-options";
import { PersistenceFieldDef } from "../src/persistence/persistence-field-def";
import { WorkflowRpcRequest } from "../../gen/iwfidl";

const noSkip = () => undefined;

const rpcState: WorkflowState = {
    get stateId() {
        return "S1";
    },
    execute(): StateDecision {
        return StateDecision.gracefulCompleteWorkflow();
    },
};

class CachingRpcWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "cachingRpc";
    }
    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(rpcState)];
    }
    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.rpcMethodDef("strong", () => "ok", { bypassCachingForStrongConsistency: true }),
            CommunicationMethodDef.rpcMethodDef("cached", () => "ok"),
        ];
    }
    getPersistenceSchema(): PersistenceFieldDef[] {
        return [PersistenceFieldDef.searchAttributeDef("score", SearchAttributeValueType.Int)];
    }
    getPersistenceOptions(): PersistenceOptions {
        return new PersistenceOptions(true);
    }
}

describe("conditional close (force-complete-if-channel-empty)", () => {
    it("builds an internal-channel conditional close with a fallback state", () => {
        const decision = StateDecision.forceCompleteIfInternalChannelEmptyOrElse(
            "queue",
            { done: true },
            "ProcessNext",
            { batch: 1 },
        );

        expect(decision.conditionalClose?.closeType).toBe(WorkflowConditionalCloseType.ForceCompleteOnInternalChannelEmpty);
        expect(decision.conditionalClose?.channelName).toBe("queue");
        expect(decision.nextStates[0].stateId).toBe("ProcessNext");

        const idl = StateDecisionMapper.toIdl(decision, defaultObjectEncoder, noSkip);
        expect(idl.conditionalClose?.conditionalCloseType).toBe(
            WorkflowConditionalCloseType.ForceCompleteOnInternalChannelEmpty,
        );
        expect(idl.conditionalClose?.channelName).toBe("queue");
        expect(defaultObjectEncoder.decode(idl.conditionalClose?.closeInput)).toEqual({ done: true });
        expect(idl.nextStates?.[0].stateId).toBe("ProcessNext");
        expect(defaultObjectEncoder.decode(idl.nextStates?.[0].stateInput)).toEqual({ batch: 1 });
    });

    it("builds a signal-channel conditional close", () => {
        const decision = StateDecision.forceCompleteIfSignalChannelEmptyOrElse("sig", "out", "Again");
        expect(decision.conditionalClose?.closeType).toBe(WorkflowConditionalCloseType.ForceCompleteOnSignalChannelEmpty);
    });
});

describe("Client.buildSearchAttribute", () => {
    it("maps each typed value onto the correct IDL field", () => {
        expect(Client.buildSearchAttribute("i", SearchAttributeValueType.Int, 7)).toEqual({
            key: "i",
            valueType: SearchAttributeValueType.Int,
            integerValue: 7,
        });
        expect(Client.buildSearchAttribute("k", SearchAttributeValueType.Keyword, "v")).toMatchObject({
            stringValue: "v",
        });
        expect(Client.buildSearchAttribute("b", SearchAttributeValueType.Bool, true)).toMatchObject({
            boolValue: true,
        });
        expect(Client.buildSearchAttribute("ka", SearchAttributeValueType.KeywordArray, ["a", "b"])).toMatchObject({
            stringArrayValue: ["a", "b"],
        });
    });

    it("round-trips with getSearchAttributeValue", () => {
        const sa = Client.buildSearchAttribute("d", SearchAttributeValueType.Double, 1.5);
        expect(Client.getSearchAttributeValue(SearchAttributeValueType.Double, sa)).toBe(1.5);
    });
});

describe("start-options wiring (delay, initial data attributes, wait-for-completion)", () => {
    it("maps the new start options onto the WorkflowStartRequest", async () => {
        const client = new UnregisteredClient(localDefaultClientOptions());
        let captured: WorkflowStartRequest | undefined;
        client.defaultApi.apiV1WorkflowStartPost = jest.fn((request: WorkflowStartRequest) => {
            captured = request;
            return Promise.resolve({ data: { workflowRunId: "run-1" } });
        }) as never;

        const options = UnregisteredWorkflowOptionsBuilder.newBuilder()
            .setStartDelaySeconds(30)
            .addAllInitialDataAttributes([{ key: "k", value: defaultObjectEncoder.encode({ n: 1 }) }])
            .addAllWaitForCompletionStateIds(["StateA"])
            .addAllWaitForCompletionStateExecutionIds(["StateA-1"])
            .setWorkflowAlreadyStartedOptions({ ignoreAlreadyStartedError: true, requestId: "req-1" })
            .build();

        const runId = await client.startWorkflow("wfType", "wf-1", 60, "Start", undefined, options);

        expect(runId).toBe("run-1");
        expect(captured?.workflowStartOptions?.workflowStartDelaySeconds).toBe(30);
        expect(captured?.workflowStartOptions?.dataAttributes?.[0].key).toBe("k");
        expect(defaultObjectEncoder.decode(captured?.workflowStartOptions?.dataAttributes?.[0].value)).toEqual({ n: 1 });
        expect(captured?.waitForCompletionStateIds).toEqual(["StateA"]);
        expect(captured?.waitForCompletionStateExecutionIds).toEqual(["StateA-1"]);
        expect(captured?.workflowStartOptions?.workflowAlreadyStartedOptions).toEqual({
            ignoreAlreadyStartedError: true,
            requestId: "req-1",
        });
    });

    it("omits the new fields when they are not set", async () => {
        const client = new UnregisteredClient(localDefaultClientOptions());
        let captured: WorkflowStartRequest | undefined;
        client.defaultApi.apiV1WorkflowStartPost = jest.fn((request: WorkflowStartRequest) => {
            captured = request;
            return Promise.resolve({ data: { workflowRunId: "run-2" } });
        }) as never;

        const options = UnregisteredWorkflowOptionsBuilder.newBuilder().build();
        await client.startWorkflow("wfType", "wf-2", 60, "Start", undefined, options);

        expect(captured?.workflowStartOptions?.workflowStartDelaySeconds).toBeUndefined();
        expect(captured?.workflowStartOptions?.dataAttributes).toBeUndefined();
        expect(captured?.waitForCompletionStateIds).toBeUndefined();
        expect(captured?.waitForCompletionStateExecutionIds).toBeUndefined();
    });
});

describe("RPC bypassCachingForStrongConsistency wiring", () => {
    const buildClient = (): { client: Client; captured: () => WorkflowRpcRequest | undefined } => {
        const registry = new Registry();
        const workflow = new CachingRpcWorkflow();
        registry.addWorkflow(workflow);
        const client = new Client(registry, localDefaultClientOptions());
        let captured: WorkflowRpcRequest | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).unregistered.invokeRpc = jest.fn((request: WorkflowRpcRequest) => {
            captured = request;
            return Promise.resolve(undefined);
        });
        return { client, captured: () => captured };
    };

    it("sends useMemoForDataAttributes=false when the RPC requests strong consistency", async () => {
        const { client, captured } = buildClient();
        await client.invokeRpc(new CachingRpcWorkflow(), "wf-1", "strong");
        expect(captured()?.useMemoForDataAttributes).toBe(false);
    });

    it("sends useMemoForDataAttributes=true when caching is enabled and no bypass requested", async () => {
        const { client, captured } = buildClient();
        await client.invokeRpc(new CachingRpcWorkflow(), "wf-1", "cached");
        expect(captured()?.useMemoForDataAttributes).toBe(true);
    });

    it("sends the registered search-attribute key-types on the RPC request", async () => {
        const { client, captured } = buildClient();
        await client.invokeRpc(new CachingRpcWorkflow(), "wf-1", "cached");
        expect(captured()?.searchAttributes).toEqual([{ key: "score", valueType: SearchAttributeValueType.Int }]);
    });
});

describe("useMemoForDataAttributes on start and reads (caching enabled)", () => {
    const buildClient = (): { client: Client; unregistered: { startWorkflow: jest.Mock; getWorkflowDataAttributes: jest.Mock } } => {
        const registry = new Registry();
        registry.addWorkflow(new CachingRpcWorkflow());
        const client = new Client(registry, localDefaultClientOptions());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unregistered = (client as any).unregistered;
        unregistered.startWorkflow = jest.fn(() => Promise.resolve("run-1"));
        unregistered.getWorkflowDataAttributes = jest.fn(() => Promise.resolve([]));
        return { client, unregistered };
    };

    it("sets useMemoForDataAttributes on the start options", async () => {
        const { client, unregistered } = buildClient();
        await client.startWorkflow(new CachingRpcWorkflow(), "wf-1", 60);
        const options = unregistered.startWorkflow.mock.calls[0][5];
        expect(options.useMemoForDataAttributes).toBe(true);
    });

    it("reads all data attributes from the memo", async () => {
        const { client, unregistered } = buildClient();
        await client.getAllWorkflowDataAttributes(new CachingRpcWorkflow(), "wf-1");
        // 4th positional arg of unregistered.getWorkflowDataAttributes is useMemoForDataAttributes
        expect(unregistered.getWorkflowDataAttributes.mock.calls[0][3]).toBe(true);
    });
});

describe("no-wait try-get result calls", () => {
    const newClient = (): { client: UnregisteredClient; getPost: jest.Mock; withWaitPost: jest.Mock } => {
        const client = new UnregisteredClient(localDefaultClientOptions());
        const getPost = jest.fn();
        const withWaitPost = jest.fn();
        client.defaultApi.apiV1WorkflowGetPost = getPost as never;
        client.defaultApi.apiV1WorkflowGetWithWaitPost = withWaitPost as never;
        return { client, getPost, withWaitPost };
    };

    it("returns the result via the non-blocking endpoint when the workflow has closed", async () => {
        const { client, getPost, withWaitPost } = newClient();
        getPost.mockResolvedValue({
            data: {
                workflowStatus: WorkflowStatus.Completed,
                results: [{ completedStateOutput: defaultObjectEncoder.encode("done") }],
            },
        });

        const output = await client.getSimpleWorkflowResult("wf-1");

        expect(defaultObjectEncoder.decode(output)).toBe("done");
        expect(getPost).toHaveBeenCalledTimes(1);
        expect(withWaitPost).not.toHaveBeenCalled(); // no long-poll
    });

    it("throws WorkflowUncompletedError without waiting when the workflow is still running", async () => {
        const { client, getPost } = newClient();
        getPost.mockResolvedValue({ data: { workflowStatus: WorkflowStatus.Running } });

        await expect(client.getComplexWorkflowResult("wf-1")).rejects.toBeInstanceOf(WorkflowUncompletedError);
    });
});

describe("reset skipUpdateReapply", () => {
    it("sends skipUpdateReapply on the reset request", async () => {
        const client = new UnregisteredClient(localDefaultClientOptions());
        let captured: { skipUpdateReapply?: boolean } | undefined;
        client.defaultApi.apiV1WorkflowResetPost = jest.fn((request: { skipUpdateReapply?: boolean }) => {
            captured = request;
            return Promise.resolve({ data: { workflowRunId: "run-1" } });
        }) as never;

        await client.resetWorkflow("wf-1", { ...resetToBeginning("redo"), skipUpdateReapply: true });

        expect(captured?.skipUpdateReapply).toBe(true);
    });
});
