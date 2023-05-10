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
exports.InterStateChannelResult = void 0;
class InterStateChannelResult {
    static getAttributeTypeMap() {
        return InterStateChannelResult.attributeTypeMap;
    }
    constructor() {
    }
}
exports.InterStateChannelResult = InterStateChannelResult;
InterStateChannelResult.discriminator = undefined;
InterStateChannelResult.attributeTypeMap = [
    {
        "name": "commandId",
        "baseName": "commandId",
        "type": "string",
        "format": ""
    },
    {
        "name": "requestStatus",
        "baseName": "requestStatus",
        "type": "ChannelRequestStatus",
        "format": ""
    },
    {
        "name": "channelName",
        "baseName": "channelName",
        "type": "string",
        "format": ""
    },
    {
        "name": "value",
        "baseName": "value",
        "type": "EncodedObject",
        "format": ""
    }
];