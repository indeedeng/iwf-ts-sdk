import { StateMovement } from "../state-movement";
import { ExecuteApiFailurePolicy, StateMovement as IdlStateMovement, WorkflowStateOptions } from "../../../gen/iwfidl/api";
import { ObjectEncoder } from "../object-encoder";
import { WorkflowState, shouldSkipWaitUntil } from "../workflow-state";
import { WorkflowDefinitionError } from "../errors";

/** Resolves a registered {@link WorkflowState} by id (so the mapper can read its declared options). */
export type StateResolver = (stateId: string) => WorkflowState | undefined;

export class StateMovementMapper {
    public static toIdl(movement: StateMovement, encoder: ObjectEncoder, resolveState: StateResolver): IdlStateMovement {
        const stateInput = encoder.encode(movement.stateInput);
        const stateOptions = movement.isClosingOrDeadEnd
            ? movement.stateOptions?.toIdl()
            : StateMovementMapper.resolveStateOptions(movement.stateId, movement.stateOptions?.toIdl(), resolveState);

        return {
            stateId: movement.stateId,
            stateInput,
            stateOptions,
            waitForKey: movement.waitForKey,
        };
    }

    /**
     * Build the IDL options for a transition to `stateId`: the per-movement override if present,
     * otherwise the target state's declared `getStateOptions()`; then the target's `skipWaitUntil`
     * is applied, and any execute-failure recovery state is filled in. Used by both the movement
     * mapper and the start path so a state's declared options always take effect.
     */
    public static resolveStateOptions(
        stateId: string,
        override: WorkflowStateOptions | undefined,
        resolveState: StateResolver,
    ): WorkflowStateOptions | undefined {
        const target = resolveState(stateId);
        let options = override ?? target?.getStateOptions?.()?.toIdl();

        if (target !== undefined) {
            options = { ...(options ?? {}), skipWaitUntil: shouldSkipWaitUntil(target) };
        }
        if (options?.executeApiFailureProceedStateId !== undefined) {
            options = StateMovementMapper.fillProceedState(options, resolveState);
        }
        return options;
    }

    /** Fill the execute-failure recovery state's options + skipWaitUntil, and reject nested policies. */
    private static fillProceedState(options: WorkflowStateOptions, resolveState: StateResolver): WorkflowStateOptions {
        const proceedStateId = options.executeApiFailureProceedStateId as string;
        const proceed = resolveState(proceedStateId);
        let proceedOptions = options.executeApiFailureProceedStateOptions ?? proceed?.getStateOptions?.()?.toIdl() ?? {};

        if (
            proceedOptions.executeApiFailurePolicy === ExecuteApiFailurePolicy.ProceedToConfiguredState ||
            proceedOptions.executeApiFailureProceedStateId !== undefined
        ) {
            throw new WorkflowDefinitionError(
                `Execute-failure recovery state ${proceedStateId} may not itself define an execute-failure proceed policy`,
            );
        }
        if (proceed !== undefined) {
            proceedOptions = { ...proceedOptions, skipWaitUntil: shouldSkipWaitUntil(proceed) };
        }
        return { ...options, executeApiFailureProceedStateOptions: proceedOptions };
    }
}
