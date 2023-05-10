"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectSerializer = void 0;
__exportStar(require("../models/ChannelRequestStatus"), exports);
__exportStar(require("../models/CommandCarryOverPolicy"), exports);
__exportStar(require("../models/CommandCarryOverType"), exports);
__exportStar(require("../models/CommandCombination"), exports);
__exportStar(require("../models/CommandRequest"), exports);
__exportStar(require("../models/CommandResults"), exports);
__exportStar(require("../models/CommandWaitingType"), exports);
__exportStar(require("../models/Context"), exports);
__exportStar(require("../models/DeciderTriggerType"), exports);
__exportStar(require("../models/EncodedObject"), exports);
__exportStar(require("../models/ErrorResponse"), exports);
__exportStar(require("../models/ErrorSubStatus"), exports);
__exportStar(require("../models/IDReusePolicy"), exports);
__exportStar(require("../models/InterStateChannelCommand"), exports);
__exportStar(require("../models/InterStateChannelPublishing"), exports);
__exportStar(require("../models/InterStateChannelResult"), exports);
__exportStar(require("../models/KeyValue"), exports);
__exportStar(require("../models/PersistenceLoadingPolicy"), exports);
__exportStar(require("../models/PersistenceLoadingType"), exports);
__exportStar(require("../models/RetryPolicy"), exports);
__exportStar(require("../models/SearchAttribute"), exports);
__exportStar(require("../models/SearchAttributeKeyAndType"), exports);
__exportStar(require("../models/SearchAttributeValueType"), exports);
__exportStar(require("../models/SignalCommand"), exports);
__exportStar(require("../models/SignalResult"), exports);
__exportStar(require("../models/StartApiFailurePolicy"), exports);
__exportStar(require("../models/StateCompletionOutput"), exports);
__exportStar(require("../models/StateDecision"), exports);
__exportStar(require("../models/StateMovement"), exports);
__exportStar(require("../models/TimerCommand"), exports);
__exportStar(require("../models/TimerResult"), exports);
__exportStar(require("../models/TimerStatus"), exports);
__exportStar(require("../models/WaitUntilApiFailurePolicy"), exports);
__exportStar(require("../models/WorkerErrorResponse"), exports);
__exportStar(require("../models/WorkflowConfig"), exports);
__exportStar(require("../models/WorkflowConfigUpdateRequest"), exports);
__exportStar(require("../models/WorkflowDumpRequest"), exports);
__exportStar(require("../models/WorkflowDumpResponse"), exports);
__exportStar(require("../models/WorkflowErrorType"), exports);
__exportStar(require("../models/WorkflowGetDataObjectsRequest"), exports);
__exportStar(require("../models/WorkflowGetDataObjectsResponse"), exports);
__exportStar(require("../models/WorkflowGetRequest"), exports);
__exportStar(require("../models/WorkflowGetResponse"), exports);
__exportStar(require("../models/WorkflowGetSearchAttributesRequest"), exports);
__exportStar(require("../models/WorkflowGetSearchAttributesResponse"), exports);
__exportStar(require("../models/WorkflowIDReusePolicy"), exports);
__exportStar(require("../models/WorkflowResetRequest"), exports);
__exportStar(require("../models/WorkflowResetResponse"), exports);
__exportStar(require("../models/WorkflowResetType"), exports);
__exportStar(require("../models/WorkflowRetryPolicy"), exports);
__exportStar(require("../models/WorkflowRpcRequest"), exports);
__exportStar(require("../models/WorkflowRpcResponse"), exports);
__exportStar(require("../models/WorkflowSearchRequest"), exports);
__exportStar(require("../models/WorkflowSearchResponse"), exports);
__exportStar(require("../models/WorkflowSearchResponseEntry"), exports);
__exportStar(require("../models/WorkflowSignalRequest"), exports);
__exportStar(require("../models/WorkflowSkipTimerRequest"), exports);
__exportStar(require("../models/WorkflowStartOptions"), exports);
__exportStar(require("../models/WorkflowStartRequest"), exports);
__exportStar(require("../models/WorkflowStartResponse"), exports);
__exportStar(require("../models/WorkflowStateDecideRequest"), exports);
__exportStar(require("../models/WorkflowStateDecideResponse"), exports);
__exportStar(require("../models/WorkflowStateOptions"), exports);
__exportStar(require("../models/WorkflowStateStartRequest"), exports);
__exportStar(require("../models/WorkflowStateStartResponse"), exports);
__exportStar(require("../models/WorkflowStatus"), exports);
__exportStar(require("../models/WorkflowStopRequest"), exports);
__exportStar(require("../models/WorkflowStopType"), exports);
__exportStar(require("../models/WorkflowWorkerRpcRequest"), exports);
__exportStar(require("../models/WorkflowWorkerRpcResponse"), exports);
const CommandCarryOverPolicy_1 = require("../models/CommandCarryOverPolicy");
const CommandCombination_1 = require("../models/CommandCombination");
const CommandRequest_1 = require("../models/CommandRequest");
const CommandResults_1 = require("../models/CommandResults");
const Context_1 = require("../models/Context");
const EncodedObject_1 = require("../models/EncodedObject");
const ErrorResponse_1 = require("../models/ErrorResponse");
const InterStateChannelCommand_1 = require("../models/InterStateChannelCommand");
const InterStateChannelPublishing_1 = require("../models/InterStateChannelPublishing");
const InterStateChannelResult_1 = require("../models/InterStateChannelResult");
const KeyValue_1 = require("../models/KeyValue");
const PersistenceLoadingPolicy_1 = require("../models/PersistenceLoadingPolicy");
const RetryPolicy_1 = require("../models/RetryPolicy");
const SearchAttribute_1 = require("../models/SearchAttribute");
const SearchAttributeKeyAndType_1 = require("../models/SearchAttributeKeyAndType");
const SignalCommand_1 = require("../models/SignalCommand");
const SignalResult_1 = require("../models/SignalResult");
const StateCompletionOutput_1 = require("../models/StateCompletionOutput");
const StateDecision_1 = require("../models/StateDecision");
const StateMovement_1 = require("../models/StateMovement");
const TimerCommand_1 = require("../models/TimerCommand");
const TimerResult_1 = require("../models/TimerResult");
const WorkerErrorResponse_1 = require("../models/WorkerErrorResponse");
const WorkflowConfig_1 = require("../models/WorkflowConfig");
const WorkflowConfigUpdateRequest_1 = require("../models/WorkflowConfigUpdateRequest");
const WorkflowDumpRequest_1 = require("../models/WorkflowDumpRequest");
const WorkflowDumpResponse_1 = require("../models/WorkflowDumpResponse");
const WorkflowGetDataObjectsRequest_1 = require("../models/WorkflowGetDataObjectsRequest");
const WorkflowGetDataObjectsResponse_1 = require("../models/WorkflowGetDataObjectsResponse");
const WorkflowGetRequest_1 = require("../models/WorkflowGetRequest");
const WorkflowGetResponse_1 = require("../models/WorkflowGetResponse");
const WorkflowGetSearchAttributesRequest_1 = require("../models/WorkflowGetSearchAttributesRequest");
const WorkflowGetSearchAttributesResponse_1 = require("../models/WorkflowGetSearchAttributesResponse");
const WorkflowResetRequest_1 = require("../models/WorkflowResetRequest");
const WorkflowResetResponse_1 = require("../models/WorkflowResetResponse");
const WorkflowRetryPolicy_1 = require("../models/WorkflowRetryPolicy");
const WorkflowRpcRequest_1 = require("../models/WorkflowRpcRequest");
const WorkflowRpcResponse_1 = require("../models/WorkflowRpcResponse");
const WorkflowSearchRequest_1 = require("../models/WorkflowSearchRequest");
const WorkflowSearchResponse_1 = require("../models/WorkflowSearchResponse");
const WorkflowSearchResponseEntry_1 = require("../models/WorkflowSearchResponseEntry");
const WorkflowSignalRequest_1 = require("../models/WorkflowSignalRequest");
const WorkflowSkipTimerRequest_1 = require("../models/WorkflowSkipTimerRequest");
const WorkflowStartOptions_1 = require("../models/WorkflowStartOptions");
const WorkflowStartRequest_1 = require("../models/WorkflowStartRequest");
const WorkflowStartResponse_1 = require("../models/WorkflowStartResponse");
const WorkflowStateDecideRequest_1 = require("../models/WorkflowStateDecideRequest");
const WorkflowStateDecideResponse_1 = require("../models/WorkflowStateDecideResponse");
const WorkflowStateOptions_1 = require("../models/WorkflowStateOptions");
const WorkflowStateStartRequest_1 = require("../models/WorkflowStateStartRequest");
const WorkflowStateStartResponse_1 = require("../models/WorkflowStateStartResponse");
const WorkflowStopRequest_1 = require("../models/WorkflowStopRequest");
const WorkflowWorkerRpcRequest_1 = require("../models/WorkflowWorkerRpcRequest");
const WorkflowWorkerRpcResponse_1 = require("../models/WorkflowWorkerRpcResponse");
/* tslint:disable:no-unused-variable */
let primitives = [
    "string",
    "boolean",
    "double",
    "integer",
    "long",
    "float",
    "number",
    "any"
];
const supportedMediaTypes = {
    "application/json": Infinity,
    "application/octet-stream": 0,
    "application/x-www-form-urlencoded": 0
};
let enumsMap = new Set([
    "ChannelRequestStatus",
    "CommandCarryOverType",
    "CommandWaitingType",
    "DeciderTriggerType",
    "ErrorSubStatus",
    "IDReusePolicy",
    "PersistenceLoadingType",
    "SearchAttributeValueType",
    "StartApiFailurePolicy",
    "TimerStatus",
    "WaitUntilApiFailurePolicy",
    "WorkflowErrorType",
    "WorkflowIDReusePolicy",
    "WorkflowResetType",
    "WorkflowStatus",
    "WorkflowStopType",
]);
let typeMap = {
    "CommandCarryOverPolicy": CommandCarryOverPolicy_1.CommandCarryOverPolicy,
    "CommandCombination": CommandCombination_1.CommandCombination,
    "CommandRequest": CommandRequest_1.CommandRequest,
    "CommandResults": CommandResults_1.CommandResults,
    "Context": Context_1.Context,
    "EncodedObject": EncodedObject_1.EncodedObject,
    "ErrorResponse": ErrorResponse_1.ErrorResponse,
    "InterStateChannelCommand": InterStateChannelCommand_1.InterStateChannelCommand,
    "InterStateChannelPublishing": InterStateChannelPublishing_1.InterStateChannelPublishing,
    "InterStateChannelResult": InterStateChannelResult_1.InterStateChannelResult,
    "KeyValue": KeyValue_1.KeyValue,
    "PersistenceLoadingPolicy": PersistenceLoadingPolicy_1.PersistenceLoadingPolicy,
    "RetryPolicy": RetryPolicy_1.RetryPolicy,
    "SearchAttribute": SearchAttribute_1.SearchAttribute,
    "SearchAttributeKeyAndType": SearchAttributeKeyAndType_1.SearchAttributeKeyAndType,
    "SignalCommand": SignalCommand_1.SignalCommand,
    "SignalResult": SignalResult_1.SignalResult,
    "StateCompletionOutput": StateCompletionOutput_1.StateCompletionOutput,
    "StateDecision": StateDecision_1.StateDecision,
    "StateMovement": StateMovement_1.StateMovement,
    "TimerCommand": TimerCommand_1.TimerCommand,
    "TimerResult": TimerResult_1.TimerResult,
    "WorkerErrorResponse": WorkerErrorResponse_1.WorkerErrorResponse,
    "WorkflowConfig": WorkflowConfig_1.WorkflowConfig,
    "WorkflowConfigUpdateRequest": WorkflowConfigUpdateRequest_1.WorkflowConfigUpdateRequest,
    "WorkflowDumpRequest": WorkflowDumpRequest_1.WorkflowDumpRequest,
    "WorkflowDumpResponse": WorkflowDumpResponse_1.WorkflowDumpResponse,
    "WorkflowGetDataObjectsRequest": WorkflowGetDataObjectsRequest_1.WorkflowGetDataObjectsRequest,
    "WorkflowGetDataObjectsResponse": WorkflowGetDataObjectsResponse_1.WorkflowGetDataObjectsResponse,
    "WorkflowGetRequest": WorkflowGetRequest_1.WorkflowGetRequest,
    "WorkflowGetResponse": WorkflowGetResponse_1.WorkflowGetResponse,
    "WorkflowGetSearchAttributesRequest": WorkflowGetSearchAttributesRequest_1.WorkflowGetSearchAttributesRequest,
    "WorkflowGetSearchAttributesResponse": WorkflowGetSearchAttributesResponse_1.WorkflowGetSearchAttributesResponse,
    "WorkflowResetRequest": WorkflowResetRequest_1.WorkflowResetRequest,
    "WorkflowResetResponse": WorkflowResetResponse_1.WorkflowResetResponse,
    "WorkflowRetryPolicy": WorkflowRetryPolicy_1.WorkflowRetryPolicy,
    "WorkflowRpcRequest": WorkflowRpcRequest_1.WorkflowRpcRequest,
    "WorkflowRpcResponse": WorkflowRpcResponse_1.WorkflowRpcResponse,
    "WorkflowSearchRequest": WorkflowSearchRequest_1.WorkflowSearchRequest,
    "WorkflowSearchResponse": WorkflowSearchResponse_1.WorkflowSearchResponse,
    "WorkflowSearchResponseEntry": WorkflowSearchResponseEntry_1.WorkflowSearchResponseEntry,
    "WorkflowSignalRequest": WorkflowSignalRequest_1.WorkflowSignalRequest,
    "WorkflowSkipTimerRequest": WorkflowSkipTimerRequest_1.WorkflowSkipTimerRequest,
    "WorkflowStartOptions": WorkflowStartOptions_1.WorkflowStartOptions,
    "WorkflowStartRequest": WorkflowStartRequest_1.WorkflowStartRequest,
    "WorkflowStartResponse": WorkflowStartResponse_1.WorkflowStartResponse,
    "WorkflowStateDecideRequest": WorkflowStateDecideRequest_1.WorkflowStateDecideRequest,
    "WorkflowStateDecideResponse": WorkflowStateDecideResponse_1.WorkflowStateDecideResponse,
    "WorkflowStateOptions": WorkflowStateOptions_1.WorkflowStateOptions,
    "WorkflowStateStartRequest": WorkflowStateStartRequest_1.WorkflowStateStartRequest,
    "WorkflowStateStartResponse": WorkflowStateStartResponse_1.WorkflowStateStartResponse,
    "WorkflowStopRequest": WorkflowStopRequest_1.WorkflowStopRequest,
    "WorkflowWorkerRpcRequest": WorkflowWorkerRpcRequest_1.WorkflowWorkerRpcRequest,
    "WorkflowWorkerRpcResponse": WorkflowWorkerRpcResponse_1.WorkflowWorkerRpcResponse,
};
class ObjectSerializer {
    static findCorrectType(data, expectedType) {
        if (data == undefined) {
            return expectedType;
        }
        else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        }
        else if (expectedType === "Date") {
            return expectedType;
        }
        else {
            if (enumsMap.has(expectedType)) {
                return expectedType;
            }
            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }
            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            }
            else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if (typeMap[discriminatorType]) {
                        return discriminatorType; // use the type given in the discriminator
                    }
                    else {
                        return expectedType; // discriminator did not map to a type
                    }
                }
                else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }
    static serialize(data, type, format) {
        if (data == undefined) {
            return data;
        }
        else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        }
        else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.serialize(date, subType, format));
            }
            return transformedData;
        }
        else if (type === "Date") {
            if (format == "date") {
                let month = data.getMonth() + 1;
                month = month < 10 ? "0" + month.toString() : month.toString();
                let day = data.getDate();
                day = day < 10 ? "0" + day.toString() : day.toString();
                return data.getFullYear() + "-" + month + "-" + day;
            }
            else {
                return data.toISOString();
            }
        }
        else {
            if (enumsMap.has(type)) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }
            // Get the actual type of this object
            type = this.findCorrectType(data, type);
            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance = {};
            for (let attributeType of attributeTypes) {
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type, attributeType.format);
            }
            return instance;
        }
    }
    static deserialize(data, type, format) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        }
        else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        }
        else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData = [];
            for (let date of data) {
                transformedData.push(ObjectSerializer.deserialize(date, subType, format));
            }
            return transformedData;
        }
        else if (type === "Date") {
            return new Date(data);
        }
        else {
            if (enumsMap.has(type)) { // is Enum
                return data;
            }
            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let attributeType of attributeTypes) {
                let value = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type, attributeType.format);
                if (value !== undefined) {
                    instance[attributeType.name] = value;
                }
            }
            return instance;
        }
    }
    /**
     * Normalize media type
     *
     * We currently do not handle any media types attributes, i.e. anything
     * after a semicolon. All content is assumed to be UTF-8 compatible.
     */
    static normalizeMediaType(mediaType) {
        if (mediaType === undefined) {
            return undefined;
        }
        return mediaType.split(";")[0].trim().toLowerCase();
    }
    /**
     * From a list of possible media types, choose the one we can handle best.
     *
     * The order of the given media types does not have any impact on the choice
     * made.
     */
    static getPreferredMediaType(mediaTypes) {
        /** According to OAS 3 we should default to json */
        if (!mediaTypes) {
            return "application/json";
        }
        const normalMediaTypes = mediaTypes.map(this.normalizeMediaType);
        let selectedMediaType = undefined;
        let selectedRank = -Infinity;
        for (const mediaType of normalMediaTypes) {
            if (supportedMediaTypes[mediaType] > selectedRank) {
                selectedMediaType = mediaType;
                selectedRank = supportedMediaTypes[mediaType];
            }
        }
        if (selectedMediaType === undefined) {
            throw new Error("None of the given media types are supported: " + mediaTypes.join(", "));
        }
        return selectedMediaType;
    }
    /**
     * Convert data to a string according the given media type
     */
    static stringify(data, mediaType) {
        if (mediaType === "text/plain") {
            return String(data);
        }
        if (mediaType === "application/json") {
            return JSON.stringify(data);
        }
        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.stringify.");
    }
    /**
     * Parse data from a string according to the given media type
     */
    static parse(rawData, mediaType) {
        if (mediaType === undefined) {
            throw new Error("Cannot parse content. No Content-Type defined.");
        }
        if (mediaType === "text/plain") {
            return rawData;
        }
        if (mediaType === "application/json") {
            return JSON.parse(rawData);
        }
        if (mediaType === "text/html") {
            return rawData;
        }
        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.parse.");
    }
}
exports.ObjectSerializer = ObjectSerializer;
