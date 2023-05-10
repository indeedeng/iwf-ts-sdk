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
exports.WorkflowSearchResponseEntry = void 0;
class WorkflowSearchResponseEntry {
    static getAttributeTypeMap() {
        return WorkflowSearchResponseEntry.attributeTypeMap;
    }
    constructor() {
    }
}
exports.WorkflowSearchResponseEntry = WorkflowSearchResponseEntry;
WorkflowSearchResponseEntry.discriminator = undefined;
WorkflowSearchResponseEntry.attributeTypeMap = [
    {
        "name": "workflowId",
        "baseName": "workflowId",
        "type": "string",
        "format": ""
    },
    {
        "name": "workflowRunId",
        "baseName": "workflowRunId",
        "type": "string",
        "format": ""
    }
];