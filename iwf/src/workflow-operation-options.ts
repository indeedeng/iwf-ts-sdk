import { WorkflowResetType, WorkflowStopType } from "../../gen/iwfidl";

export interface StopWorkflowOptions {
    stopType?: WorkflowStopType;
    reason?: string;
}

export interface ResetWorkflowOptions {
    resetType: WorkflowResetType;
    reason?: string;
    historyEventId?: number;
    historyEventTime?: string;
    stateId?: string;
    stateExecutionId?: string;
    skipSignalReapply?: boolean;
    /** Skip re-applying update operations when resetting. */
    skipUpdateReapply?: boolean;
}

export function resetToBeginning(reason?: string): ResetWorkflowOptions {
    return { resetType: WorkflowResetType.Beginning, reason };
}

export function resetToHistoryEventId(historyEventId: number, reason?: string): ResetWorkflowOptions {
    return { resetType: WorkflowResetType.HistoryEventId, historyEventId, reason };
}

export function resetToHistoryEventTime(historyEventTime: string, reason?: string): ResetWorkflowOptions {
    return { resetType: WorkflowResetType.HistoryEventTime, historyEventTime, reason };
}

export function resetToStateId(stateId: string, reason?: string): ResetWorkflowOptions {
    return { resetType: WorkflowResetType.StateId, stateId, reason };
}

export function resetToStateExecutionId(stateExecutionId: string, reason?: string): ResetWorkflowOptions {
    return { resetType: WorkflowResetType.StateExecutionId, stateExecutionId, reason };
}
