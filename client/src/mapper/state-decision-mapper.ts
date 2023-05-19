import { StateDecision } from "../state-decision";
import { StateDecision as IdlStateDecision } from "../../../gen/iwfidl/api";
import { StateMovementMapper } from "./state-movement-mapper";

export class StateDecisionMapper {
    public static toIdlStateDecision(stateDecision: StateDecision): IdlStateDecision {
        return {
            nextStates: stateDecision.nextStates.map((stateMovement) => {
                return StateMovementMapper.toIdlStateMovement(stateMovement);
            }),
        };
    }
}
