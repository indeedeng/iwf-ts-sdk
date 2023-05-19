import { EncodedObject } from "../../gen/iwfidl/api";
import { StateMovement, StateMovementBuilder } from "./state-movement";

export class StateDecision {
    public readonly _nextStates: StateMovement[];

    public static nextState(stateId: string, input: EncodedObject): StateDecision {
        return new StateDecision([StateMovement.createWithInput(stateId, input)]);
    }

    public static gracefulCompleteWorkflow(): StateDecision {
        return new StateDecision([StateMovement.gracefulCompletingWorkflow()]);
    }

    public static gracefulCompleteWorkflowWithInput(stateInput: EncodedObject): StateDecision {
        return new StateDecision([StateMovement.gracefulCompletingWorkflowWithInput(stateInput)]);
    }

    public static forceCompleteWorkflow(): StateDecision {
        return new StateDecision([StateMovement.forceCompletingWorkflow()]);
    }

    public static forceFailWorkflow(): StateDecision {
        return new StateDecision([StateMovement.forceFailingWorkflow()]);
    }

    constructor(nextStates: StateMovement[]) {
        this._nextStates = nextStates;
    }

    get nextStates(): StateMovement[] {
        return this._nextStates;
    }
}

export class StateDecisionBuilder {
    private readonly nextStates: StateMovement[] = [];

    public addNextState(nextState: StateMovement): StateDecisionBuilder {
        this.nextStates.push(nextState);
        return this;
    }

    public addAllNextStates(nextStates: StateMovement[]): StateDecisionBuilder {
        this.nextStates.push(...nextStates);
        return this;
    }

    public build(): StateDecision {
        return new StateDecision(this.nextStates);
    }
}
