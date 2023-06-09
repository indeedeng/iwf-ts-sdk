import { SearchAttribute, SearchAttributeValueType } from "../../gen/iwfidl";

export class Client {
    public static getSearchAttributeValue(saType: SearchAttributeValueType, saValue: SearchAttribute): string | number | boolean | Array<string> | undefined {
        switch (saType) {
            case SearchAttributeValueType.Text:
                return saValue.stringValue;
            case SearchAttributeValueType.Int:
                return saValue.integerValue;
            case SearchAttributeValueType.Double:
                return saValue.doubleValue;
            case SearchAttributeValueType.Bool:
                return saValue.boolValue;
            case SearchAttributeValueType.Datetime:
                return saValue.stringValue;
            case SearchAttributeValueType.Keyword:
                return saValue.stringValue;
            case SearchAttributeValueType.KeywordArray:
                return saValue.stringArrayValue;
            default:
                throw new Error(`Invalid search attribute type: ${saType}`);
        }
    }
}