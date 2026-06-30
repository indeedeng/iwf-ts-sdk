import { StateDecision } from "../src/state-decision";
import { StateDecisionMapper } from "../src/mapper/state-decision-mapper";
import { Client } from "../src/client";
import { defaultObjectEncoder } from "../src/object-encoder";
import { SearchAttributeValueType, WorkflowConditionalCloseType } from "../../gen/iwfidl";

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
