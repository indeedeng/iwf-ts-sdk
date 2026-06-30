import { PersistenceLoadingPolicy } from "../../../gen/iwfidl";
import { Context } from "../context";
import { Persistence } from "../persistence/persistence";
import { Communication } from "./communication";

/**
 * A workflow RPC handler. Invoked by an external caller via Client.invokeRpc. Can read/write
 * persistence, publish to internal channels, and trigger state movements. Returns the RPC output
 * (or undefined / void). May be async.
 */
export type RpcHandler = (
    context: Context,
    input: unknown,
    persistence: Persistence,
    communication: Communication,
) => unknown | Promise<unknown>;

/** Per-RPC options controlling timeout and how persistence is loaded for the call. */
export interface RpcOptions {
    timeoutSeconds?: number;
    dataAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    searchAttributesLoadingPolicy?: PersistenceLoadingPolicy;
    /** Bypass data-attribute caching to read strongly-consistent values. */
    bypassCachingForStrongConsistency?: boolean;
}
