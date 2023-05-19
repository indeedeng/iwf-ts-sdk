"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateDecisionMapper = void 0;
const state_movement_mapper_1 = require("./state-movement-mapper");
class StateDecisionMapper {
    static toIdlStateDecision(stateDecision) {
        return {
            nextStates: stateDecision.nextStates.map((stateMovement) => {
                return state_movement_mapper_1.StateMovementMapper.toIdlStateMovement(stateMovement);
            }),
        };
    }
}
exports.StateDecisionMapper = StateDecisionMapper;
