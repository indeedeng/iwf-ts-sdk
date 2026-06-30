import { StateDecision } from "../src/state-decision";
import { StateDecisionMapper } from "../src/mapper/state-decision-mapper";
import { Client } from "../src/client";
import { defaultObjectEncoder } from "../src/object-encoder";
import { SearchAttributeValueType, WorkflowConditionalCloseType, WorkflowStartRequest } from "../../gen/iwfidl";
import { UnregisteredClient } from "../src/unregistered-client";
import { UnregisteredWorkflowOptionsBuilder } from "../src/unregistered-workflow-options";
import { localDefaultClientOptions } from "../src/client-options";

const noSkip = () => undefined;

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
            .build();

        const runId = await client.startWorkflow("wfType", "wf-1", 60, "Start", undefined, options);

        expect(runId).toBe("run-1");
        expect(captured?.workflowStartOptions?.workflowStartDelaySeconds).toBe(30);
        expect(captured?.workflowStartOptions?.dataAttributes?.[0].key).toBe("k");
        expect(defaultObjectEncoder.decode(captured?.workflowStartOptions?.dataAttributes?.[0].value)).toEqual({ n: 1 });
        expect(captured?.waitForCompletionStateIds).toEqual(["StateA"]);
        expect(captured?.waitForCompletionStateExecutionIds).toEqual(["StateA-1"]);
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
