import { SearchAttributeValueType } from "../../../gen/iwfidl";

export enum PersistenceFieldType {
    DataAttribute = "DataAttribute",
    SearchAttribute = "SearchAttribute",
}

/**
 * Declares a single persistence field (a data attribute or a search attribute) in a workflow's
 * persistence schema. Use the static factories to construct.
 */
export class PersistenceFieldDef {
    public readonly key: string;
    public readonly fieldType: PersistenceFieldType;
    /** Present only for search attributes. */
    public readonly searchAttributeType?: SearchAttributeValueType;
    /** When true, {@link key} is treated as a prefix matching any number of dynamically-named fields. */
    public readonly isPrefix: boolean;

    private constructor(
        key: string,
        fieldType: PersistenceFieldType,
        isPrefix: boolean,
        searchAttributeType?: SearchAttributeValueType,
    ) {
        this.key = key;
        this.fieldType = fieldType;
        this.isPrefix = isPrefix;
        this.searchAttributeType = searchAttributeType;
    }

    /** Define a data attribute with an exact key. */
    public static dataAttributeDef(key: string): PersistenceFieldDef {
        return new PersistenceFieldDef(key, PersistenceFieldType.DataAttribute, false);
    }

    /** Define dynamically-named data attributes sharing a key prefix. */
    public static dataAttributePrefixDef(keyPrefix: string): PersistenceFieldDef {
        return new PersistenceFieldDef(keyPrefix, PersistenceFieldType.DataAttribute, true);
    }

    /** Define a typed, indexed search attribute. */
    public static searchAttributeDef(key: string, valueType: SearchAttributeValueType): PersistenceFieldDef {
        return new PersistenceFieldDef(key, PersistenceFieldType.SearchAttribute, false, valueType);
    }
}
