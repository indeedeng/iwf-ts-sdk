import { StateMovement } from "../state-movement";
import { StateMovement as IdlStateMovement } from "../../../gen/iwfidl/api";

export class StateMovementMapper {
    public static toIdlStateMovement(stateMovement: StateMovement): IdlStateMovement {
        return {
            stateId: stateMovement.stateId,
            stateInput: stateMovement.stateInput
        };
    }
}
