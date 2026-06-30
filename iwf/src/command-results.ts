import { ChannelRequestStatus, TimerStatus } from "../../gen/iwfidl";

export interface TimerCommandResult {
    commandId: string;
    status: TimerStatus;
}

export interface SignalCommandResult {
    commandId: string;
    signalChannelName: string;
    status: ChannelRequestStatus;
    /** The decoded signal value, if one was received. */
    value?: unknown;
}

export interface InternalChannelCommandResult {
    commandId: string;
    channelName: string;
    status: ChannelRequestStatus;
    /** The decoded channel value, if one was received. */
    value?: unknown;
}

/**
 * The results of the commands a state waited on, delivered to {@link WorkflowState.execute}.
 * Provides typed result arrays plus lookup helpers by command id or channel name.
 */
export class CommandResults {
    public readonly timerResults: TimerCommandResult[];
    public readonly signalResults: SignalCommandResult[];
    public readonly internalChannelResults: InternalChannelCommandResult[];
    /** Whether the waitUntil API call itself succeeded (relevant with PROCEED_ON_FAILURE). */
    public readonly waitUntilApiSucceeded?: boolean;

    constructor(
        timerResults: TimerCommandResult[] = [],
        signalResults: SignalCommandResult[] = [],
        internalChannelResults: InternalChannelCommandResult[] = [],
        waitUntilApiSucceeded?: boolean,
    ) {
        this.timerResults = timerResults;
        this.signalResults = signalResults;
        this.internalChannelResults = internalChannelResults;
        this.waitUntilApiSucceeded = waitUntilApiSucceeded;
    }

    public getSignalResultByCommandId(commandId: string): SignalCommandResult | undefined {
        return this.signalResults.find((r) => r.commandId === commandId);
    }

    public getSignalValueByCommandId(commandId: string): unknown {
        return this.getSignalResultByCommandId(commandId)?.value;
    }

    public getInternalChannelResultByCommandId(commandId: string): InternalChannelCommandResult | undefined {
        return this.internalChannelResults.find((r) => r.commandId === commandId);
    }

    public getInternalChannelValueByCommandId(commandId: string): unknown {
        return this.getInternalChannelResultByCommandId(commandId)?.value;
    }

    public getTimerResultByCommandId(commandId: string): TimerCommandResult | undefined {
        return this.timerResults.find((r) => r.commandId === commandId);
    }
}
