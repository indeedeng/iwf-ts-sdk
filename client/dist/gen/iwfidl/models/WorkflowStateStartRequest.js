"use strict";
/**
 * Workflow APIs
 * This APIs for iwf SDKs to operate workflows
 *
 * OpenAPI spec version: 1.0.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStateStartRequest = void 0;
class WorkflowStateStartRequest {
    static getAttributeTypeMap() {
        return WorkflowStateStartRequest.attributeTypeMap;
    }
    constructor() {
    }
}
exports.WorkflowStateStartRequest = WorkflowStateStartRequest;
WorkflowStateStartRequest.discriminator = undefined;
WorkflowStateStartRequest.attributeTypeMap = [
    {
        "name": "context",
        "baseName": "context",
        "type": "Context",
        "format": ""
    },
    {
        "name": "workflowType",
        "baseName": "workflowType",
        "type": "string",
        "format": ""
    },
    {
        "name": "workflowStateId",
        "baseName": "workflowStateId",
        "type": "string",
        "format": ""
    },
    {
        "name": "stateInput",
        "baseName": "stateInput",
        "type": "EncodedObject",
        "format": ""
    },
    {
        "name": "searchAttributes",
        "baseName": "searchAttributes",
        "type": "Array<SearchAttribute>",
        "format": ""
    },
    {
        "name": "dataObjects",
        "baseName": "dataObjects",
        "type": "Array<KeyValue>",
        "format": ""
    }
];