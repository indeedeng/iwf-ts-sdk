import { ChannelInfo, EncodedObject, InterStateChannelPublishing } from "../../../gen/iwfidl";
import { ObjectEncoder } from "../object-encoder";
import { StateMovement } from "../state-movement";
import { InvalidArgumentError } from "../errors";

/** Per-channel queue sizes the server provides for the current invocation, keyed by channel name. */
export interface ChannelInfoMap {
    [channelName: string]: ChannelInfo;
}

/**
 * Communication primitives available inside state methods and RPCs: publishing messages to
 * internal channels, reading channel queue sizes, and (from RPCs only) triggering new state executions.
 */
export interface Communication {
    /** Publish a value to an internal channel for another state to consume. */
    publishInternalChannel(channelName: string, value?: unknown): void;

    /** Current internal-channel queue size, including messages published earlier in this invocation. */
    getInternalChannelSize(channelName: string): number;

    /** Current signal-channel queue size (number of unconsumed signals). */
    getSignalChannelSize(channelName: string): number;

    /**
     * Trigger one or more state executions. Only valid inside an RPC; calling it from a state's
     * waitUntil/execute has no effect (state flow is controlled via the returned StateDecision).
     */
    triggerStateMovements(...movements: StateMovement[]): void;
}

export class CommunicationImpl implements Communication {
    private readonly encoder: ObjectEncoder;
    private readonly toPublish: InterStateChannelPublishing[] = [];
    private readonly toTrigger: StateMovement[] = [];

    /** Optional registry-backed check that an internal-channel name is declared (by exact name or prefix). */
    private readonly isValidInternalChannelName?: (name: string) => boolean;
    /** Optional registry-backed check that a signal-channel name is declared (by exact name or prefix). */
    private readonly isValidSignalChannelName?: (name: string) => boolean;
    private readonly internalChannelInfos: ChannelInfoMap;
    private readonly signalChannelInfos: ChannelInfoMap;

    constructor(
        encoder: ObjectEncoder,
        isValidInternalChannelName?: (name: string) => boolean,
        isValidSignalChannelName?: (name: string) => boolean,
        internalChannelInfos?: ChannelInfoMap,
        signalChannelInfos?: ChannelInfoMap,
    ) {
        this.encoder = encoder;
        this.isValidInternalChannelName = isValidInternalChannelName;
        this.isValidSignalChannelName = isValidSignalChannelName;
        this.internalChannelInfos = internalChannelInfos ?? {};
        this.signalChannelInfos = signalChannelInfos ?? {};
    }

    public publishInternalChannel(channelName: string, value?: unknown): void {
        this.checkInternalChannelName(channelName);
        const encoded: EncodedObject | undefined = value === undefined ? undefined : this.encoder.encode(value);
        this.toPublish.push({ channelName, value: encoded });
    }

    public getInternalChannelSize(channelName: string): number {
        this.checkInternalChannelName(channelName);
        const delivered = this.internalChannelInfos[channelName]?.size ?? 0;
        const pending = this.toPublish.filter((p) => p.channelName === channelName).length;
        return delivered + pending;
    }

    public getSignalChannelSize(channelName: string): number {
        this.checkSignalChannelName(channelName);
        return this.signalChannelInfos[channelName]?.size ?? 0;
    }

    private checkInternalChannelName(channelName: string): void {
        if (this.isValidInternalChannelName !== undefined && !this.isValidInternalChannelName(channelName)) {
            throw new InvalidArgumentError(`Internal channel ${channelName} is not declared in the workflow communication schema`);
        }
    }

    private checkSignalChannelName(channelName: string): void {
        if (this.isValidSignalChannelName !== undefined && !this.isValidSignalChannelName(channelName)) {
            throw new InvalidArgumentError(`Signal channel ${channelName} is not declared in the workflow communication schema`);
        }
    }

    public triggerStateMovements(...movements: StateMovement[]): void {
        this.toTrigger.push(...movements);
    }

    public getToPublishInternalChannel(): InterStateChannelPublishing[] {
        return this.toPublish;
    }

    public getToTriggerStateMovements(): StateMovement[] {
        return this.toTrigger;
    }
}
