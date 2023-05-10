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
exports.ErrorResponse = void 0;
class ErrorResponse {
    static getAttributeTypeMap() {
        return ErrorResponse.attributeTypeMap;
    }
    constructor() {
    }
}
exports.ErrorResponse = ErrorResponse;
ErrorResponse.discriminator = undefined;
ErrorResponse.attributeTypeMap = [
    {
        "name": "detail",
        "baseName": "detail",
        "type": "string",
        "format": ""
    },
    {
        "name": "subStatus",
        "baseName": "subStatus",
        "type": "ErrorSubStatus",
        "format": ""
    },
    {
        "name": "originalWorkerErrorDetail",
        "baseName": "originalWorkerErrorDetail",
        "type": "string",
        "format": ""
    },
    {
        "name": "originalWorkerErrorType",
        "baseName": "originalWorkerErrorType",
        "type": "string",
        "format": ""
    },
    {
        "name": "originalWorkerErrorStatus",
        "baseName": "originalWorkerErrorStatus",
        "type": "number",
        "format": ""
    }
];
