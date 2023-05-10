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
exports.WorkflowStartOptions = void 0;
class WorkflowStartOptions {
    static getAttributeTypeMap() {
        return WorkflowStartOptions.attributeTypeMap;
    }
    constructor() {
    }
}
exports.WorkflowStartOptions = WorkflowStartOptions;
WorkflowStartOptions.discriminator = undefined;
WorkflowStartOptions.attributeTypeMap = [
    {
        "name": "workflowIDReusePolicy",
        "baseName": "workflowIDReusePolicy",
        "type": "WorkflowIDReusePolicy",
        "format": ""
    },
    {
        "name": "cronSchedule",
        "baseName": "cronSchedule",
        "type": "string",
        "format": ""
    },
    {
        "name": "retryPolicy",
        "baseName": "retryPolicy",
        "type": "WorkflowRetryPolicy",
        "format": ""
    },
    {
        "name": "searchAttributes",
        "baseName": "searchAttributes",
        "type": "Array<SearchAttribute>",
        "format": ""
    },
    {
        "name": "workflowConfigOverride",
        "baseName": "workflowConfigOverride",
        "type": "WorkflowConfig",
        "format": ""
    },
    {
        "name": "idReusePolicy",
        "baseName": "idReusePolicy",
        "type": "IDReusePolicy",
        "format": ""
    }
];
