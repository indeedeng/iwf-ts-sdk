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
exports.KeyValue = void 0;
class KeyValue {
    static getAttributeTypeMap() {
        return KeyValue.attributeTypeMap;
    }
    constructor() {
    }
}
exports.KeyValue = KeyValue;
KeyValue.discriminator = undefined;
KeyValue.attributeTypeMap = [
    {
        "name": "key",
        "baseName": "key",
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
