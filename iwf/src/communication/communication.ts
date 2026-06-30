import { EncodedObject, InterStateChannelPublishing } from "../../../gen/iwfidl";
import { ObjectEncoder } from "../object-encoder";
import { StateMovement } from "../state-movement";

/**
 * Communication primitives available inside state methods and RPCs: publishing messages to
 * internal channels, and (from RPCs only) triggering new state executions.
 */
export interface Communication {
    /** Publish a value to an internal channel for another state to consume. */
    publishInternalChannel(channelName: string, value?: unknown): void;

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

    constructor(encoder: ObjectEncoder) {
        this.encoder = encoder;
    }

    public publishInternalChannel(channelName: string, value?: unknown): void {
        const encoded: EncodedObject | undefined = value === undefined ? undefined : this.encoder.encode(value);
        this.toPublish.push({ channelName, value: encoded });
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
