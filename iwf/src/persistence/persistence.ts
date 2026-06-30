import { EncodedObject, KeyValue, SearchAttribute, SearchAttributeValueType } from "../../../gen/iwfidl";
import { ObjectEncoder } from "../object-encoder";
import { InvalidArgumentError } from "../errors";

/**
 * Read/write access to workflow persistence available inside state methods and RPCs:
 * data attributes (arbitrary serialized values), strongly-typed search attributes,
 * state-execution-local values (transient, scoped to one state execution), and event recording.
 */
export interface Persistence {
    getDataAttribute<T = unknown>(key: string): T | undefined;
    setDataAttribute(key: string, value: unknown): void;

    getSearchAttributeInt(key: string): number | undefined;
    setSearchAttributeInt(key: string, value: number): void;

    getSearchAttributeDouble(key: string): number | undefined;
    setSearchAttributeDouble(key: string, value: number): void;

    getSearchAttributeBoolean(key: string): boolean | undefined;
    setSearchAttributeBoolean(key: string, value: boolean): void;

    getSearchAttributeKeyword(key: string): string | undefined;
    setSearchAttributeKeyword(key: string, value: string): void;

    getSearchAttributeText(key: string): string | undefined;
    setSearchAttributeText(key: string, value: string): void;

    /** Datetime search attributes are represented as ISO-8601 strings. */
    getSearchAttributeDatetime(key: string): string | undefined;
    setSearchAttributeDatetime(key: string, value: string): void;

    getSearchAttributeKeywordArray(key: string): string[] | undefined;
    setSearchAttributeKeywordArray(key: string, value: string[]): void;

    getStateExecutionLocal<T = unknown>(key: string): T | undefined;
    setStateExecutionLocal(key: string, value: unknown): void;

    /** Record an event for debugging/tracking; surfaced in the workflow history. */
    recordEvent(key: string, value: unknown): void;
}

/**
 * Default Persistence implementation. Seeded with the attributes the server sent for the current
 * state execution; tracks writes so the worker can return the upsert payloads.
 */
export class PersistenceImpl implements Persistence {
    private readonly encoder: ObjectEncoder;

    private readonly dataAttributes: Map<string, EncodedObject>;
    private readonly searchAttributes: Map<string, SearchAttribute>;
    private readonly stateLocals: Map<string, EncodedObject>;

    private readonly dataAttributeUpserts = new Map<string, EncodedObject>();
    private readonly searchAttributeUpserts = new Map<string, SearchAttribute>();
    private readonly stateLocalUpserts = new Map<string, EncodedObject>();
    private readonly recordedEvents = new Map<string, EncodedObject>();

    /** Optional registry-backed check that a data-attribute key is declared (by exact key or prefix). */
    private readonly isValidDataAttributeKey?: (key: string) => boolean;

    constructor(
        encoder: ObjectEncoder,
        dataAttributes: Map<string, EncodedObject>,
        searchAttributes: Map<string, SearchAttribute>,
        stateLocals: Map<string, EncodedObject>,
        isValidDataAttributeKey?: (key: string) => boolean,
    ) {
        this.encoder = encoder;
        this.dataAttributes = dataAttributes;
        this.searchAttributes = searchAttributes;
        this.stateLocals = stateLocals;
        this.isValidDataAttributeKey = isValidDataAttributeKey;
    }

    public getDataAttribute<T = unknown>(key: string): T | undefined {
        this.checkDataAttributeKey(key);
        const encoded = this.dataAttributeUpserts.get(key) ?? this.dataAttributes.get(key);
        return this.encoder.decode<T>(encoded);
    }

    public setDataAttribute(key: string, value: unknown): void {
        this.checkDataAttributeKey(key);
        const encoded = this.encoder.encode(value);
        if (encoded !== undefined) {
            this.dataAttributeUpserts.set(key, encoded);
        }
    }

    private checkDataAttributeKey(key: string): void {
        if (this.isValidDataAttributeKey !== undefined && !this.isValidDataAttributeKey(key)) {
            throw new InvalidArgumentError(`Data attribute ${key} is not declared in the workflow persistence schema`);
        }
    }

    public getStateExecutionLocal<T = unknown>(key: string): T | undefined {
        const encoded = this.stateLocalUpserts.get(key) ?? this.stateLocals.get(key);
        return this.encoder.decode<T>(encoded);
    }

    public setStateExecutionLocal(key: string, value: unknown): void {
        const encoded = this.encoder.encode(value);
        if (encoded !== undefined) {
            this.stateLocalUpserts.set(key, encoded);
        }
    }

    public recordEvent(key: string, value: unknown): void {
        const encoded = this.encoder.encode(value);
        if (encoded !== undefined) {
            this.recordedEvents.set(key, encoded);
        }
    }

    public getSearchAttributeInt(key: string): number | undefined {
        return this.readSearchAttribute(key)?.integerValue;
    }

    public setSearchAttributeInt(key: string, value: number): void {
        this.searchAttributeUpserts.set(key, { key, valueType: SearchAttributeValueType.Int, integerValue: value });
    }

    public getSearchAttributeDouble(key: string): number | undefined {
        return this.readSearchAttribute(key)?.doubleValue;
    }

    public setSearchAttributeDouble(key: string, value: number): void {
        this.searchAttributeUpserts.set(key, { key, valueType: SearchAttributeValueType.Double, doubleValue: value });
    }

    public getSearchAttributeBoolean(key: string): boolean | undefined {
        return this.readSearchAttribute(key)?.boolValue;
    }

    public setSearchAttributeBoolean(key: string, value: boolean): void {
        this.searchAttributeUpserts.set(key, { key, valueType: SearchAttributeValueType.Bool, boolValue: value });
    }

    public getSearchAttributeKeyword(key: string): string | undefined {
        return this.readSearchAttribute(key)?.stringValue;
    }

    public setSearchAttributeKeyword(key: string, value: string): void {
        this.searchAttributeUpserts.set(key, { key, valueType: SearchAttributeValueType.Keyword, stringValue: value });
    }

    public getSearchAttributeText(key: string): string | undefined {
        return this.readSearchAttribute(key)?.stringValue;
    }

    public setSearchAttributeText(key: string, value: string): void {
        this.searchAttributeUpserts.set(key, { key, valueType: SearchAttributeValueType.Text, stringValue: value });
    }

    public getSearchAttributeDatetime(key: string): string | undefined {
        return this.readSearchAttribute(key)?.stringValue;
    }

    public setSearchAttributeDatetime(key: string, value: string): void {
        this.searchAttributeUpserts.set(key, { key, valueType: SearchAttributeValueType.Datetime, stringValue: value });
    }

    public getSearchAttributeKeywordArray(key: string): string[] | undefined {
        return this.readSearchAttribute(key)?.stringArrayValue;
    }

    public setSearchAttributeKeywordArray(key: string, value: string[]): void {
        this.searchAttributeUpserts.set(key, {
            key,
            valueType: SearchAttributeValueType.KeywordArray,
            stringArrayValue: value,
        });
    }

    private readSearchAttribute(key: string): SearchAttribute | undefined {
        return this.searchAttributeUpserts.get(key) ?? this.searchAttributes.get(key);
    }

    // --- upsert extraction (used by WorkerService to build responses) ---

    public getUpsertDataAttributes(): KeyValue[] {
        return mapToKeyValues(this.dataAttributeUpserts);
    }

    public getUpsertSearchAttributes(): SearchAttribute[] {
        return Array.from(this.searchAttributeUpserts.values());
    }

    public getUpsertStateLocals(): KeyValue[] {
        return mapToKeyValues(this.stateLocalUpserts);
    }

    public getRecordEvents(): KeyValue[] {
        return mapToKeyValues(this.recordedEvents);
    }
}

function mapToKeyValues(map: Map<string, EncodedObject>): KeyValue[] {
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
}

/** Build a key -> EncodedObject map from a list of IDL KeyValue entries. */
export function keyValuesToMap(keyValues: KeyValue[] | undefined): Map<string, EncodedObject> {
    const map = new Map<string, EncodedObject>();
    (keyValues ?? []).forEach((kv) => {
        if (kv.key !== undefined && kv.value !== undefined) {
            map.set(kv.key, kv.value);
        }
    });
    return map;
}

/** Build a key -> SearchAttribute map from a list of IDL SearchAttribute entries. */
export function searchAttributesToMap(searchAttributes: SearchAttribute[] | undefined): Map<string, SearchAttribute> {
    const map = new Map<string, SearchAttribute>();
    (searchAttributes ?? []).forEach((sa) => {
        if (sa.key !== undefined) {
            map.set(sa.key, sa);
        }
    });
    return map;
}
