import {
    KeyValue,
    SearchAttribute,
    WorkflowStateExecuteRequest,
    WorkflowStateExecuteResponse,
    WorkflowStateWaitUntilRequest,
    WorkflowStateWaitUntilResponse,
    WorkflowWorkerRpcRequest,
    WorkflowWorkerRpcResponse,
} from "../../gen/iwfidl";
import { Registry } from "./registry";
import { WorkerOptions, resolveWorkerObjectEncoder } from "./worker-options";
import { ObjectEncoder } from "./object-encoder";
import { ContextMapper } from "./mapper/context-mapper";
import { CommandRequestMapper } from "./mapper/command-request-mapper";
import { CommandResultsMapper } from "./mapper/command-results-mapper";
import { StateDecisionMapper } from "./mapper/state-decision-mapper";
import { StateResolver } from "./mapper/state-movement-mapper";
import { ChannelInfoMap, CommunicationImpl } from "./communication/communication";
import { PersistenceImpl, keyValuesToMap, searchAttributesToMap } from "./persistence/persistence";
import { CommandRequest } from "./command-request";
import { InternalChannelCommand } from "./command/internal-channel-command";
import { StateDecision } from "./state-decision";
import { NotRegisteredError, WorkflowDefinitionError } from "./errors";

/** Bundle of what a single state/RPC invocation reads and writes. */
interface InvocationIo {
    persistence: PersistenceImpl;
    communication: CommunicationImpl;
}

/**
 * Handles the callbacks the iWF server makes into the worker: waitUntil, execute, and RPC.
 * Framework-agnostic — the three handler methods take a parsed request body and return a response
 * body. Wire them to any HTTP server (e.g. Express) at the path constants below.
 */
export class WorkerService {
    public static readonly API_PATH_WORKFLOW_STATE_WAIT_UNTIL = "/api/v1/workflowState/start";
    public static readonly API_PATH_WORKFLOW_STATE_EXECUTE = "/api/v1/workflowState/decide";
    public static readonly API_PATH_WORKFLOW_WORKER_RPC = "/api/v1/workflowWorker/rpc";

    private readonly registry: Registry;
    private readonly encoder: ObjectEncoder;

    constructor(registry: Registry, options?: WorkerOptions) {
        this.registry = registry;
        this.encoder = resolveWorkerObjectEncoder(options);
    }

    public async handleWorkflowStateWaitUntil(
        request: WorkflowStateWaitUntilRequest,
    ): Promise<WorkflowStateWaitUntilResponse> {
        const state = this.getState(request.workflowType, request.workflowStateId);
        const context = ContextMapper.fromIdl(request.context, request.workflowType);
        const io = this.buildIo(request.workflowType, request.searchAttributes, request.dataObjects, undefined);
        const input = this.encoder.decode(request.stateInput);

        const commandRequest =
            typeof state.waitUntil === "function"
                ? await state.waitUntil(context, input, io.persistence, io.communication)
                : CommandRequest.empty();

        // A state may not both publish to an internal channel and wait on it in the same call —
        // the ordering of its own message vs the wait is ambiguous (matches the Java SDK).
        const published = new Set(io.communication.getToPublishInternalChannel().map((p) => p.channelName));
        commandRequest.getCommands.forEach((cmd) => {
            if (cmd instanceof InternalChannelCommand && published.has(cmd.channelName)) {
                throw new WorkflowDefinitionError(
                    `It is not allowed to publish and wait on the same internal channel "${cmd.channelName}" in one waitUntil`,
                );
            }
        });

        return {
            commandRequest: CommandRequestMapper.toIdlCommandRequest(commandRequest),
            upsertSearchAttributes: io.persistence.getUpsertSearchAttributes(),
            upsertDataObjects: io.persistence.getUpsertDataAttributes(),
            upsertStateLocals: io.persistence.getUpsertStateLocals(),
            recordEvents: io.persistence.getRecordEvents(),
            publishToInterStateChannel: io.communication.getToPublishInternalChannel(),
        };
    }

    public async handleWorkflowStateExecute(
        request: WorkflowStateExecuteRequest,
    ): Promise<WorkflowStateExecuteResponse> {
        const state = this.getState(request.workflowType, request.workflowStateId);
        const context = ContextMapper.fromIdl(request.context, request.workflowType);
        const io = this.buildIo(request.workflowType, request.searchAttributes, request.DataObjects, request.stateLocals);
        const input = this.encoder.decode(request.stateInput);
        const commandResults = CommandResultsMapper.fromIdl(request.commandResults, this.encoder);

        const decision = await state.execute(
            context,
            input,
            commandResults,
            io.persistence,
            io.communication,
        );
        if (decision === undefined || decision === null || decision.nextStates.length === 0) {
            throw new WorkflowDefinitionError(
                `State ${request.workflowStateId} returned an empty state decision; execute must return a next state or a workflow-completion decision`,
            );
        }

        return {
            stateDecision: StateDecisionMapper.toIdl(decision, this.encoder, this.stateResolver(request.workflowType)),
            upsertSearchAttributes: io.persistence.getUpsertSearchAttributes(),
            upsertDataObjects: io.persistence.getUpsertDataAttributes(),
            upsertStateLocals: io.persistence.getUpsertStateLocals(),
            recordEvents: io.persistence.getRecordEvents(),
            publishToInterStateChannel: io.communication.getToPublishInternalChannel(),
        };
    }

    public async handleWorkflowWorkerRpc(request: WorkflowWorkerRpcRequest): Promise<WorkflowWorkerRpcResponse> {
        const rpc = this.registry.getRpc(request.workflowType, request.rpcName);
        if (rpc === undefined || rpc.rpcHandler === undefined) {
            throw new NotRegisteredError(`RPC ${request.rpcName} is not registered for workflow ${request.workflowType}`);
        }

        const context = ContextMapper.fromIdl(request.context, request.workflowType);
        const io = this.buildIo(
            request.workflowType,
            request.searchAttributes,
            request.dataAttributes,
            undefined,
            request.internalChannelInfos,
            request.signalChannelInfos,
            true, // RPCs may trigger state movements
        );
        const input = this.encoder.decode(request.input);

        const output = await rpc.rpcHandler(context, input, io.persistence, io.communication);

        const triggered = io.communication.getToTriggerStateMovements();
        const stateDecision =
            triggered.length > 0
                ? StateDecisionMapper.toIdl(new StateDecision(triggered), this.encoder, this.stateResolver(request.workflowType))
                : undefined;

        return {
            output: this.encoder.encode(output),
            stateDecision,
            upsertSearchAttributes: io.persistence.getUpsertSearchAttributes(),
            upsertDataAttributes: io.persistence.getUpsertDataAttributes(),
            upsertStateLocals: io.persistence.getUpsertStateLocals(),
            recordEvents: io.persistence.getRecordEvents(),
            publishToInterStateChannel: io.communication.getToPublishInternalChannel(),
        };
    }

    private getState(workflowType: string, stateId: string) {
        const stateDef = this.registry.getWorkflowState(workflowType, stateId);
        if (stateDef === undefined) {
            throw new NotRegisteredError(`Workflow state ${stateId} is not registered for workflow ${workflowType}`);
        }
        return stateDef.workflowState;
    }

    private buildIo(
        workflowType: string,
        searchAttributes: SearchAttribute[] | undefined,
        dataAttributes: KeyValue[] | undefined,
        stateLocals: KeyValue[] | undefined,
        internalChannelInfos?: ChannelInfoMap,
        signalChannelInfos?: ChannelInfoMap,
        allowTriggerStateMovements = false,
    ): InvocationIo {
        const persistence = new PersistenceImpl(
            this.encoder,
            keyValuesToMap(dataAttributes),
            searchAttributesToMap(searchAttributes),
            keyValuesToMap(stateLocals),
            (key) => this.registry.isValidDataAttributeKey(workflowType, key),
            (key) => this.registry.getSearchAttributeTypes(workflowType).get(key),
        );
        const communication = new CommunicationImpl(
            this.encoder,
            (name) => this.registry.isValidInternalChannelName(workflowType, name),
            (name) => this.registry.isValidSignalChannelName(workflowType, name),
            internalChannelInfos,
            signalChannelInfos,
            allowTriggerStateMovements,
        );
        return { persistence, communication };
    }

    private stateResolver(workflowType: string): StateResolver {
        return (stateId: string) => this.registry.getWorkflowState(workflowType, stateId)?.workflowState;
    }
}
