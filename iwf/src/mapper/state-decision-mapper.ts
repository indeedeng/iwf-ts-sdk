import { StateDecision } from "../state-decision";
import { StateDecision as IdlStateDecision, WorkflowConditionalClose } from "../../../gen/iwfidl/api";
import { StateResolver, StateMovementMapper } from "./state-movement-mapper";
import { ObjectEncoder } from "../object-encoder";

export class StateDecisionMapper {
    public static toIdl(
        stateDecision: StateDecision,
        encoder: ObjectEncoder,
        resolveState: StateResolver,
    ): IdlStateDecision {
        let conditionalClose: WorkflowConditionalClose | undefined;
        if (stateDecision.conditionalClose) {
            conditionalClose = {
                conditionalCloseType: stateDecision.conditionalClose.closeType,
                channelName: stateDecision.conditionalClose.channelName,
                closeInput: encoder.encode(stateDecision.conditionalClose.closeOutput),
            };
        }

        return {
            nextStates: stateDecision.nextStates.map((movement) =>
                StateMovementMapper.toIdl(movement, encoder, resolveState),
            ),
            conditionalClose,
        };
    }
}
