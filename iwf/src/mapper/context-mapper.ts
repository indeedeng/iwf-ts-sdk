import { Context as IdlContext } from "../../../gen/iwfidl";
import { Context, ContextBuilder } from "../context";

export class ContextMapper {
    public static fromIdl(idlContext: IdlContext, workflowType?: string): Context {
        const builder = new ContextBuilder()
            .setWorkflowId(idlContext.workflowId)
            .setWorkflowRunId(idlContext.workflowRunId)
            .setWorkflowStartTimestampSeconds(idlContext.workflowStartedTimestamp)
            .setStateExecutionId(idlContext.stateExecutionId)
            .setWorkflowType(workflowType);

        if (idlContext.stateExecutionId !== undefined) {
            // Stable id for idempotent child-workflow starts (matches the Java SDK).
            builder.setChildWorkflowRequestId(`${idlContext.workflowRunId}-${idlContext.stateExecutionId}`);
        }

        if (idlContext.attempt !== undefined) {
            builder.setAttempt(idlContext.attempt);
        }
        if (idlContext.firstAttemptTimestamp !== undefined) {
            builder.setFirstAttemptTimestampSeconds(idlContext.firstAttemptTimestamp);
        }
        return builder.build();
    }
}
