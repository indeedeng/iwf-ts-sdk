import { Registry } from "../src/registry";
import { ObjectWorkflow } from "../src/object-workflow";
import { StateDef } from "../src/state-definition";
import { WorkflowState } from "../src/workflow-state";
import { StateDecision } from "../src/state-decision";
import { PersistenceFieldDef } from "../src/persistence/persistence-field-def";
import { CommunicationMethodDef } from "../src/communication/communication-method-def";
import { SearchAttributeValueType } from "../../gen/iwfidl";
import { WorkflowDefinitionError } from "../src/errors";

const state: WorkflowState = {
    get stateId() {
        return "S1";
    },
    execute(): StateDecision {
        return StateDecision.gracefulCompleteWorkflow();
    },
};

class SampleWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "sample";
    }
    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(state)];
    }
    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.dataAttributeDef("user"),
            PersistenceFieldDef.searchAttributeDef("score", SearchAttributeValueType.Int),
        ];
    }
    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.signalChannelDef("sig"),
            CommunicationMethodDef.internalChannelDef("chan"),
            CommunicationMethodDef.rpcMethodDef("doThing", () => "ok"),
        ];
    }
}

describe("Registry", () => {
    it("registers and looks up workflow, state, rpc, and attribute types", () => {
        const registry = new Registry();
        registry.addWorkflow(new SampleWorkflow());

        expect(registry.getWorkflow("sample")).toBeDefined();
        expect(registry.getWorkflowState("sample", "S1")?.canStartWorkflow).toBe(true);
        expect(registry.getRpc("sample", "doThing")).toBeDefined();
        expect(registry.getSearchAttributeTypes("sample").get("score")).toBe(SearchAttributeValueType.Int);
        expect(registry.getDataAttributeKeys("sample").has("user")).toBe(true);
        expect(registry.getSignalChannelNames("sample").has("sig")).toBe(true);
        expect(registry.getInternalChannelNames("sample").has("chan")).toBe(true);
    });

    it("rejects duplicate workflow registration", () => {
        const registry = new Registry();
        registry.addWorkflow(new SampleWorkflow());
        expect(() => registry.addWorkflow(new SampleWorkflow())).toThrow(WorkflowDefinitionError);
    });
});

class PrefixWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "prefixed";
    }
    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(state)];
    }
    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.searchAttributeDef("score", SearchAttributeValueType.Int),
            PersistenceFieldDef.dataAttributeDef("user"),
            PersistenceFieldDef.dataAttributePrefixDef("cache_"),
        ];
    }
    getCommunicationSchema(): CommunicationMethodDef[] {
        return [
            CommunicationMethodDef.signalChannelDef("sig"),
            CommunicationMethodDef.signalChannelPrefixDef("sig_"),
            CommunicationMethodDef.internalChannelDef("chan"),
            CommunicationMethodDef.internalChannelPrefixDef("chan_"),
        ];
    }
}

describe("Registry prefix-based dynamic fields", () => {
    const registry = new Registry();
    registry.addWorkflow(new PrefixWorkflow());

    it("keeps prefix data-attribute declarations out of the exact-key enumeration", () => {
        // Search attributes are exact-only (no prefix support, matching the Java SDK).
        expect(registry.getSearchAttributeTypes("prefixed").get("score")).toBe(SearchAttributeValueType.Int);
        expect(Array.from(registry.getDataAttributeKeys("prefixed"))).toEqual(["user"]);
    });

    it("validates data-attribute keys by exact key and by prefix", () => {
        expect(registry.isValidDataAttributeKey("prefixed", "user")).toBe(true);
        expect(registry.isValidDataAttributeKey("prefixed", "cache_42")).toBe(true);
        expect(registry.isValidDataAttributeKey("prefixed", "nope")).toBe(false);
    });

    it("validates channel names by exact name and by prefix", () => {
        expect(registry.isValidSignalChannelName("prefixed", "sig")).toBe(true);
        expect(registry.isValidSignalChannelName("prefixed", "sig_orders")).toBe(true);
        expect(registry.isValidSignalChannelName("prefixed", "other")).toBe(false);
        expect(registry.isValidInternalChannelName("prefixed", "chan_1")).toBe(true);
        expect(registry.isValidInternalChannelName("prefixed", "other")).toBe(false);
    });
});
