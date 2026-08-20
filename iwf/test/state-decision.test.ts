import { StateDecision } from "../src/state-decision";
import { StateMovement } from "../src/state-movement";
import { InvalidArgumentError } from "../src/errors";

describe("StateDecision / StateMovement", () => {
    it("creates a single next state movement", () => {
        const decision = StateDecision.singleNextState("S2", { x: 1 });
        expect(decision.nextStates).toHaveLength(1);
        expect(decision.nextStates[0].stateId).toBe("S2");
        expect(decision.nextStates[0].stateInput).toEqual({ x: 1 });
        expect(decision.nextStates[0].isClosingOrDeadEnd).toBe(false);
    });

    it("creates multiple parallel next states", () => {
        const decision = StateDecision.multiNextStates(
            StateMovement.create("A"),
            StateMovement.create("B"),
        );
        expect(decision.nextStates.map((m) => m.stateId)).toEqual(["A", "B"]);
    });

    it("rejects empty multiNextStates", () => {
        expect(() => StateDecision.multiNextStates()).toThrow(InvalidArgumentError);
    });

    it("rejects movements using the reserved prefix", () => {
        expect(() => StateMovement.create("_SYS_FOO")).toThrow(InvalidArgumentError);
    });

    it("produces closing/dead-end movements", () => {
        expect(StateDecision.gracefulCompleteWorkflow("done").nextStates[0].isClosingOrDeadEnd).toBe(true);
        expect(StateDecision.forceCompleteWorkflow().nextStates[0].isClosingOrDeadEnd).toBe(true);
        expect(StateDecision.forceFailWorkflow().nextStates[0].isClosingOrDeadEnd).toBe(true);
        expect(StateDecision.deadEnd().nextStates[0].isClosingOrDeadEnd).toBe(true);
    });
});
