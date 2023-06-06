"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMovementMapper = void 0;
class StateMovementMapper {
    static toIdlStateMovement(stateMovement) {
        return {
            stateId: stateMovement.stateId,
            stateInput: stateMovement.stateInput
        };
    }
}
exports.StateMovementMapper = StateMovementMapper;
