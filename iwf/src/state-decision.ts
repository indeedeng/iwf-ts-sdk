import { WorkflowConditionalCloseType } from "../../gen/iwfidl";
import { InvalidArgumentError } from "./errors";
import { StateMovement } from "./state-movement";
import { WorkflowStateOptions } from "./workflow-state-options";

/**
 * An atomic conditional workflow close: e.g. "complete the workflow only if this channel is empty,
 * otherwise proceed to the next state(s)". `closeOutput` is the native (unencoded) workflow output.
 */
export interface ConditionalClose {
    closeType: WorkflowConditionalCloseType;
    channelName: string;
    closeOutput?: unknown;
}

/**
 * The decision returned from a state's execute method: where the workflow goes next, or how it
 * closes. Built via the static factories.
 */
export class StateDecision {
    public readonly nextStates: StateMovement[];
    public readonly conditionalClose?: ConditionalClose;

    constructor(nextStates: StateMovement[], conditionalClose?: ConditionalClose) {
        this.nextStates = nextStates;
        this.conditionalClose = conditionalClose;
    }

    /** Move to a single next state. */
    public static singleNextState(
        stateId: string,
        input?: unknown,
        stateOptions?: WorkflowStateOptions,
    ): StateDecision {
        return new StateDecision([StateMovement.create(stateId, input, stateOptions)]);
    }

    /** Move to multiple states in parallel. */
    public static multiNextStates(...movements: StateMovement[]): StateDecision {
        if (movements.length === 0) {
            throw new InvalidArgumentError("multiNextStates requires at least one state movement");
        }
        return new StateDecision(movements);
    }

    /** Complete the workflow once all running states finish. */
    public static gracefulCompleteWorkflow(output?: unknown): StateDecision {
        return new StateDecision([StateMovement.gracefulCompletingWorkflow(output)]);
    }

    /** Complete the workflow immediately, abandoning other running states. */
    public static forceCompleteWorkflow(output?: unknown): StateDecision {
        return new StateDecision([StateMovement.forceCompletingWorkflow(output)]);
    }

    /** Fail the workflow. */
    public static forceFailWorkflow(output?: unknown): StateDecision {
        return new StateDecision([StateMovement.forceFailingWorkflow(output)]);
    }

    /** End this execution branch without closing the workflow (e.g. awaiting an RPC trigger). */
    public static deadEnd(): StateDecision {
        return new StateDecision([StateMovement.deadEnd()]);
    }

    /**
     * Atomically complete the workflow if the named internal channel is empty; otherwise proceed
     * to the given fallback state.
     */
    public static forceCompleteIfInternalChannelEmptyOrElse(
        channelName: string,
        completeOutput: unknown,
        orElseStateId: string,
        orElseInput?: unknown,
        orElseStateOptions?: WorkflowStateOptions,
    ): StateDecision {
        return new StateDecision([StateMovement.create(orElseStateId, orElseInput, orElseStateOptions)], {
            closeType: WorkflowConditionalCloseType.ForceCompleteOnInternalChannelEmpty,
            channelName,
            closeOutput: completeOutput,
        });
    }

    /**
     * Atomically complete the workflow if the named signal channel is empty; otherwise proceed to
     * the given fallback state.
     */
    public static forceCompleteIfSignalChannelEmptyOrElse(
        channelName: string,
        completeOutput: unknown,
        orElseStateId: string,
        orElseInput?: unknown,
        orElseStateOptions?: WorkflowStateOptions,
    ): StateDecision {
        return new StateDecision([StateMovement.create(orElseStateId, orElseInput, orElseStateOptions)], {
            closeType: WorkflowConditionalCloseType.ForceCompleteOnSignalChannelEmpty,
            channelName,
            closeOutput: completeOutput,
        });
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
