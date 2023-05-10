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
exports.TimerResult = void 0;
class TimerResult {
    static getAttributeTypeMap() {
        return TimerResult.attributeTypeMap;
    }
    constructor() {
    }
}
exports.TimerResult = TimerResult;
TimerResult.discriminator = undefined;
TimerResult.attributeTypeMap = [
    {
        "name": "commandId",
        "baseName": "commandId",
        "type": "string",
        "format": ""
    },
    {
        "name": "timerStatus",
        "baseName": "timerStatus",
        "type": "TimerStatus",
        "format": ""
    }
];