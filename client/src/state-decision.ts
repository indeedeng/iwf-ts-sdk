import { StateMovement } from "./state-movement";

export class StateDecision {
    public readonly nextStates: StateMovement[];

    constructor(nextStates: StateMovement[]) {
        this.nextStates = nextStates;
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
