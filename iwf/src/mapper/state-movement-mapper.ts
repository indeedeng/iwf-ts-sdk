import { StateMovement } from "../state-movement";
import { StateMovement as IdlStateMovement, WorkflowStateOptions } from "../../../gen/iwfidl/api";
import { ObjectEncoder } from "../object-encoder";

/** Resolves whether a target state's waitUntil phase should be skipped, by state id. */
export type SkipWaitUntilResolver = (stateId: string) => boolean | undefined;

export class StateMovementMapper {
    public static toIdl(
        movement: StateMovement,
        encoder: ObjectEncoder,
        resolveSkipWaitUntil: SkipWaitUntilResolver,
    ): IdlStateMovement {
        const stateInput = encoder.encode(movement.stateInput);

        let stateOptions: WorkflowStateOptions | undefined = movement.stateOptions?.toIdl();

        if (!movement.isClosingOrDeadEnd) {
            const skip = resolveSkipWaitUntil(movement.stateId);
            if (skip !== undefined) {
                stateOptions = { ...(stateOptions ?? {}), skipWaitUntil: skip };
            }
        }

        return {
            stateId: movement.stateId,
            stateInput,
            stateOptions,
            waitForKey: movement.waitForKey,
        };
    }
}
