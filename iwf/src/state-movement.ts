import { InvalidArgumentError } from "./errors";
import { WorkflowStateOptions } from "./workflow-state-options";

/**
 * A movement to a next state (or to a workflow-closing pseudo-state). Holds a native, not-yet-
 * encoded input; encoding and skipWaitUntil resolution happen at the mapping boundary.
 */
export class StateMovement {
    private readonly _stateId: string;
    private readonly _stateInput?: unknown;
    private readonly _stateOptions?: WorkflowStateOptions;
    private readonly _waitForKey?: string;

    public static readonly RESERVED_STATE_ID_PREFIX = "_SYS_";
    public static readonly GRACEFUL_COMPLETING_WORKFLOW_STATE_ID = "_SYS_GRACEFUL_COMPLETING_WORKFLOW";
    public static readonly FORCE_COMPLETING_WORKFLOW_STATE_ID = "_SYS_FORCE_COMPLETING_WORKFLOW";
    public static readonly FORCE_FAILING_WORKFLOW_STATE_ID = "_SYS_FORCE_FAILING_WORKFLOW";
    public static readonly DEAD_END_WORKFLOW_STATE_ID = "_SYS_DEAD_END";

    constructor(stateId: string, stateInput?: unknown, stateOptions?: WorkflowStateOptions, waitForKey?: string) {
        this._stateId = stateId;
        this._stateInput = stateInput;
        this._stateOptions = stateOptions;
        this._waitForKey = waitForKey;
    }

    /**
     * Move to a user-defined state. Throws if the id collides with a reserved system prefix.
     * `waitForKey` tags this execution so a client can wait on it via waitForStateExecutionCompletionByKey.
     */
    public static create(
        stateId: string,
        stateInput?: unknown,
        stateOptions?: WorkflowStateOptions,
        waitForKey?: string,
    ): StateMovement {
        if (stateId.startsWith(StateMovement.RESERVED_STATE_ID_PREFIX)) {
            throw new InvalidArgumentError(`State id ${stateId} uses the reserved prefix ${StateMovement.RESERVED_STATE_ID_PREFIX}`);
        }
        return new StateMovement(stateId, stateInput, stateOptions, waitForKey);
    }

    public static gracefulCompletingWorkflow(stateInput?: unknown): StateMovement {
        return new StateMovement(StateMovement.GRACEFUL_COMPLETING_WORKFLOW_STATE_ID, stateInput);
    }

    public static forceCompletingWorkflow(stateInput?: unknown): StateMovement {
        return new StateMovement(StateMovement.FORCE_COMPLETING_WORKFLOW_STATE_ID, stateInput);
    }

    public static forceFailingWorkflow(stateInput?: unknown): StateMovement {
        return new StateMovement(StateMovement.FORCE_FAILING_WORKFLOW_STATE_ID, stateInput);
    }

    public static deadEnd(): StateMovement {
        return new StateMovement(StateMovement.DEAD_END_WORKFLOW_STATE_ID);
    }

    get stateId(): string {
        return this._stateId;
    }

    get stateInput(): unknown {
        return this._stateInput;
    }

    get stateOptions(): WorkflowStateOptions | undefined {
        return this._stateOptions;
    }

    get waitForKey(): string | undefined {
        return this._waitForKey;
    }

    /** True for movements that target a workflow-closing or dead-end system state. */
    get isClosingOrDeadEnd(): boolean {
        return this._stateId.startsWith(StateMovement.RESERVED_STATE_ID_PREFIX);
    }
}

export class StateMovementBuilder {
    private stateId = "";
    private stateInput?: unknown;
    private stateOptions?: WorkflowStateOptions;
    private waitForKey?: string;

    public setStateId(stateId: string): StateMovementBuilder {
        this.stateId = stateId;
        return this;
    }

    public setStateInput(stateInput: unknown): StateMovementBuilder {
        this.stateInput = stateInput;
        return this;
    }

    public setStateOptions(stateOptions: WorkflowStateOptions): StateMovementBuilder {
        this.stateOptions = stateOptions;
        return this;
    }

    public setWaitForKey(waitForKey: string): StateMovementBuilder {
        this.waitForKey = waitForKey;
        return this;
    }

    public build(): StateMovement {
        return StateMovement.create(this.stateId, this.stateInput, this.stateOptions, this.waitForKey);
    }
}
