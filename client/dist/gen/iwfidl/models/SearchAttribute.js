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
exports.SearchAttribute = void 0;
class SearchAttribute {
    static getAttributeTypeMap() {
        return SearchAttribute.attributeTypeMap;
    }
    constructor() {
    }
}
exports.SearchAttribute = SearchAttribute;
SearchAttribute.discriminator = undefined;
SearchAttribute.attributeTypeMap = [
    {
        "name": "key",
        "baseName": "key",
        "type": "string",
        "format": ""
    },
    {
        "name": "stringValue",
        "baseName": "stringValue",
        "type": "string",
        "format": ""
    },
    {
        "name": "integerValue",
        "baseName": "integerValue",
        "type": "number",
        "format": "int64"
    },
    {
        "name": "doubleValue",
        "baseName": "doubleValue",
        "type": "number",
        "format": "double"
    },
    {
        "name": "boolValue",
        "baseName": "boolValue",
        "type": "boolean",
        "format": ""
    },
    {
        "name": "stringArrayValue",
        "baseName": "stringArrayValue",
        "type": "Array<string>",
        "format": ""
    },
    {
        "name": "valueType",
        "baseName": "valueType",
        "type": "SearchAttributeValueType",
        "format": ""
    }
];
