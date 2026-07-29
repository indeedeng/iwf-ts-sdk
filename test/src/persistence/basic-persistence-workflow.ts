import {
    CommandRequest,
    CommandResults,
    Communication,
    Context,
    ObjectWorkflow,
    Persistence,
    PersistenceFieldDef,
    SearchAttributeValueType,
    StateDecision,
    StateDef,
    WorkflowState,
} from "../../../iwf";

export const TEST_INIT_DATA_OBJECT_KEY = "data-obj-0";
export const TEST_DATA_OBJECT_KEY = "data-obj-1";
export const TEST_DATA_OBJECT_MODEL_1 = "data-obj-2";
export const TEST_DATA_OBJECT_MODEL_2 = "data-obj-3";
export const TEST_DATA_OBJECT_PREFIX = "data-obj-prefix-";
export const TEST_SEARCH_ATTRIBUTE_KEYWORD = "CustomKeywordField";
export const TEST_SEARCH_ATTRIBUTE_INT = "CustomIntField";
export const TEST_SEARCH_ATTRIBUTE_DATE_TIME = "CustomDatetimeField";

/** Java's BasicPersistenceWorkflowState1.testDateTimeValue. */
export const TEST_DATE_TIME_VALUE = "2023-04-17T21:17:49-00:00";
/** 1681766269 == 2023-04-17T21:17:49Z, set as epoch seconds in waitUntil. */
const INITIAL_DATE_TIME_EPOCH = "1681766269";

/**
 * Ports Java's `BasicPersistenceWorkflowState1`: exercises data attributes (including a
 * prefix-declared dynamic key), state-execution locals, recorded events, and three search-attribute
 * types across waitUntil and execute.
 */
export class BasicPersistenceWorkflowState1 implements WorkflowState {
    public static readonly STATE_ID = "query-s1";

    public get stateId(): string {
        return BasicPersistenceWorkflowState1.STATE_ID;
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, "query-start");
        // Java exercises class-hierarchy assignment here; TS has no declared value types, so these are
        // just two object-valued data attributes.
        persistence.setDataAttribute(TEST_DATA_OBJECT_MODEL_1, { workflowId: "fake" });
        persistence.setDataAttribute(TEST_DATA_OBJECT_MODEL_2, { workflowId: "fake" });
        // A dynamically-named attribute under the registered prefix.
        persistence.setDataAttribute(`${TEST_DATA_OBJECT_PREFIX}1`, 11);
        persistence.setStateExecutionLocal("test-key", "test-value-1");
        persistence.recordEvent("event-1", "event-1");
        // Java's recordEvent is varargs; TS takes a single value, so the multi-value case is an array.
        persistence.recordEvent("event-2", ["event-1", 2, "event-3"]);
        persistence.setSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT, 1);
        persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, "keyword-1");
        // Setting a datetime by epoch-seconds timestamp.
        persistence.setSearchAttributeDatetime(TEST_SEARCH_ATTRIBUTE_DATE_TIME, INITIAL_DATE_TIME_EPOCH);
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        const dt = persistence.getSearchAttributeDatetime(TEST_SEARCH_ATTRIBUTE_DATE_TIME);
        if (dt !== INITIAL_DATE_TIME_EPOCH) {
            throw new Error("datetime is incorrect");
        }
        persistence.setSearchAttributeDatetime(TEST_SEARCH_ATTRIBUTE_DATE_TIME, TEST_DATE_TIME_VALUE);

        const str = persistence.getDataAttribute<string>(TEST_DATA_OBJECT_KEY);
        persistence.setDataAttribute(TEST_DATA_OBJECT_KEY, `${str}-query-decide`);
        persistence.getDataAttribute(TEST_DATA_OBJECT_MODEL_1);
        persistence.getDataAttribute(TEST_DATA_OBJECT_MODEL_2);

        // The prefix-declared key that was written resolves; a sibling that was never written does not.
        if (persistence.getDataAttribute<number>(`${TEST_DATA_OBJECT_PREFIX}1`) !== 11) {
            throw new Error("prefix data attribute is incorrect");
        }
        if (persistence.getDataAttribute<number>(`${TEST_DATA_OBJECT_PREFIX}2`) !== undefined) {
            throw new Error("unwritten prefix data attribute should be undefined");
        }

        if (persistence.getStateExecutionLocal<string>("test-key") === "test-value-1") {
            persistence.setStateExecutionLocal("test-key", "test-value-2");
        }
        persistence.recordEvent("event-1", "event-1");
        persistence.recordEvent("event-2", "event-2");

        if (
            persistence.getSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT) === 1 &&
            persistence.getSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD) === "keyword-1"
        ) {
            persistence.setSearchAttributeInt(TEST_SEARCH_ATTRIBUTE_INT, 2);
            persistence.setSearchAttributeKeyword(TEST_SEARCH_ATTRIBUTE_KEYWORD, "keyword-2");
        }

        return StateDecision.gracefulCompleteWorkflow("test-value-2");
    }
}

/** Ports Java's `BasicPersistenceWorkflow`. */
export class BasicPersistenceWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "BasicPersistenceWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new BasicPersistenceWorkflowState1())];
    }

    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.dataAttributeDef(TEST_INIT_DATA_OBJECT_KEY),
            PersistenceFieldDef.dataAttributeDef(TEST_DATA_OBJECT_KEY),
            PersistenceFieldDef.dataAttributeDef(TEST_DATA_OBJECT_MODEL_1),
            PersistenceFieldDef.dataAttributeDef(TEST_DATA_OBJECT_MODEL_2),
            PersistenceFieldDef.dataAttributePrefixDef(TEST_DATA_OBJECT_PREFIX),
            PersistenceFieldDef.searchAttributeDef(TEST_SEARCH_ATTRIBUTE_INT, SearchAttributeValueType.Int),
            PersistenceFieldDef.searchAttributeDef(TEST_SEARCH_ATTRIBUTE_KEYWORD, SearchAttributeValueType.Keyword),
            PersistenceFieldDef.searchAttributeDef(TEST_SEARCH_ATTRIBUTE_DATE_TIME, SearchAttributeValueType.Datetime),
        ];
    }
}
