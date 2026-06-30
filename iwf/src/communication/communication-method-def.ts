import { RpcHandler, RpcOptions } from "./rpc-definition";

export enum CommunicationMethodType {
    SignalChannel = "SignalChannel",
    InternalChannel = "InternalChannel",
    Rpc = "Rpc",
}

/**
 * Declares one communication method in a workflow's communication schema: a signal channel, an
 * internal channel, or an RPC method. Use the static factories to construct.
 */
export class CommunicationMethodDef {
    public readonly name: string;
    public readonly methodType: CommunicationMethodType;
    public readonly isPrefix: boolean;
    /** Present only for RPC methods. */
    public readonly rpcHandler?: RpcHandler;
    /** Present only for RPC methods. */
    public readonly rpcOptions?: RpcOptions;

    private constructor(
        name: string,
        methodType: CommunicationMethodType,
        isPrefix: boolean,
        rpcHandler?: RpcHandler,
        rpcOptions?: RpcOptions,
    ) {
        this.name = name;
        this.methodType = methodType;
        this.isPrefix = isPrefix;
        this.rpcHandler = rpcHandler;
        this.rpcOptions = rpcOptions;
    }

    /** Define a signal channel that external callers can signal into. */
    public static signalChannelDef(name: string): CommunicationMethodDef {
        return new CommunicationMethodDef(name, CommunicationMethodType.SignalChannel, false);
    }

    /** Define signal channels sharing a name prefix. */
    public static signalChannelPrefixDef(namePrefix: string): CommunicationMethodDef {
        return new CommunicationMethodDef(namePrefix, CommunicationMethodType.SignalChannel, true);
    }

    /** Define an internal channel for inter-state message passing. */
    public static internalChannelDef(name: string): CommunicationMethodDef {
        return new CommunicationMethodDef(name, CommunicationMethodType.InternalChannel, false);
    }

    /** Define internal channels sharing a name prefix. */
    public static internalChannelPrefixDef(namePrefix: string): CommunicationMethodDef {
        return new CommunicationMethodDef(namePrefix, CommunicationMethodType.InternalChannel, true);
    }

    /** Define an RPC method, invokable by name via Client.invokeRpc. */
    public static rpcMethodDef(name: string, handler: RpcHandler, options?: RpcOptions): CommunicationMethodDef {
        return new CommunicationMethodDef(name, CommunicationMethodType.Rpc, false, handler, options);
    }
}
