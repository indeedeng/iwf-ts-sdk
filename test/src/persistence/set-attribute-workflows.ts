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

export const SEARCH_ATTRIBUTE_KEYWORD = "CustomKeywordField";
export const SEARCH_ATTRIBUTE_TEXT = "CustomTextField";
export const SEARCH_ATTRIBUTE_DOUBLE = "CustomDoubleField";
export const SEARCH_ATTRIBUTE_INT = "CustomIntField";
export const SEARCH_ATTRIBUTE_BOOL = "CustomBoolField";
export const SEARCH_ATTRIBUTE_KEYWORD_ARRAY = "CustomKeywordArrayField";
export const SEARCH_ATTRIBUTE_DATE_TIME = "CustomDatetimeField";

export const DATA_OBJECT_KEY = "data-obj-key-1";
export const DATA_OBJECT_MODEL_KEY = "data-obj-1";
export const DATA_OBJECT_KEY_PREFIX = "data-obj-key-prefix-";

/** A state that does nothing but complete with "test-result", shared by both fixtures below. */
class CompleteWithTestResultState implements WorkflowState {
    constructor(private readonly id: string) {}

    public get stateId(): string {
        return this.id;
    }

    public waitUntil(
        _context: Context,
        _input: unknown,
        _persistence: Persistence,
        _communication: Communication,
    ): CommandRequest {
        return CommandRequest.empty();
    }

    public execute(
        _context: Context,
        _input: unknown,
        _commandResults: CommandResults,
        _persistence: Persistence,
        _communication: Communication,
    ): StateDecision {
        return StateDecision.gracefulCompleteWorkflow("test-result");
    }
}

/** Ports Java's `SetSearchAttributeWorkflow`: declares one of every search-attribute type. */
export class SetSearchAttributeWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "SetSearchAttributeWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new CompleteWithTestResultState("setSearchAttribute-s1"))];
    }

    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.searchAttributeDef(SEARCH_ATTRIBUTE_INT, SearchAttributeValueType.Int),
            PersistenceFieldDef.searchAttributeDef(SEARCH_ATTRIBUTE_KEYWORD, SearchAttributeValueType.Keyword),
            PersistenceFieldDef.searchAttributeDef(SEARCH_ATTRIBUTE_DATE_TIME, SearchAttributeValueType.Datetime),
            PersistenceFieldDef.searchAttributeDef(SEARCH_ATTRIBUTE_TEXT, SearchAttributeValueType.Text),
            PersistenceFieldDef.searchAttributeDef(SEARCH_ATTRIBUTE_DOUBLE, SearchAttributeValueType.Double),
            PersistenceFieldDef.searchAttributeDef(SEARCH_ATTRIBUTE_BOOL, SearchAttributeValueType.Bool),
            PersistenceFieldDef.searchAttributeDef(
                SEARCH_ATTRIBUTE_KEYWORD_ARRAY,
                SearchAttributeValueType.KeywordArray,
            ),
        ];
    }
}

/** Ports Java's `SetDataAttributeWorkflow`: two exact keys plus a prefix-declared dynamic one. */
export class SetDataAttributeWorkflow implements ObjectWorkflow {
    getWorkflowType(): string {
        return "SetDataAttributeWorkflow";
    }

    getWorkflowStates(): StateDef[] {
        return [StateDef.startingState(new CompleteWithTestResultState("setDataAttribute-s1"))];
    }

    getPersistenceSchema(): PersistenceFieldDef[] {
        return [
            PersistenceFieldDef.dataAttributeDef(DATA_OBJECT_KEY),
            PersistenceFieldDef.dataAttributeDef(DATA_OBJECT_MODEL_KEY),
            PersistenceFieldDef.dataAttributePrefixDef(DATA_OBJECT_KEY_PREFIX),
        ];
    }
}
