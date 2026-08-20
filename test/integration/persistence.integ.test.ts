import { SearchAttributeValue } from "../../iwf";
import {
    BasicPersistenceWorkflow,
    TEST_DATA_OBJECT_KEY,
    TEST_DATA_OBJECT_PREFIX,
    TEST_INIT_DATA_OBJECT_KEY,
    TEST_SEARCH_ATTRIBUTE_DATE_TIME,
    TEST_SEARCH_ATTRIBUTE_INT,
    TEST_SEARCH_ATTRIBUTE_KEYWORD,
} from "../src/persistence/basic-persistence-workflow";
import {
    DATA_OBJECT_KEY,
    DATA_OBJECT_KEY_PREFIX,
    DATA_OBJECT_MODEL_KEY,
    SEARCH_ATTRIBUTE_BOOL,
    SEARCH_ATTRIBUTE_DATE_TIME,
    SEARCH_ATTRIBUTE_DOUBLE,
    SEARCH_ATTRIBUTE_INT,
    SEARCH_ATTRIBUTE_KEYWORD,
    SEARCH_ATTRIBUTE_KEYWORD_ARRAY,
    SEARCH_ATTRIBUTE_TEXT,
    SetDataAttributeWorkflow,
    SetSearchAttributeWorkflow,
} from "../src/persistence/set-attribute-workflows";
import { newClient, uniqueId, useWorker } from "./helpers";

// Ports Java's PersistenceTest.
describe("PersistenceTest", () => {
    useWorker();

    const KEYWORD_VALUE_1 = "keyword-1";
    const KEYWORD_VALUE_2 = "keyword-2";
    const TEXT_VALUE_1 = "text-1";
    const DOUBLE_VALUE_1 = 1;
    const INTEGER_VALUE_1 = 1;
    const BOOLEAN_VALUE_1 = true;
    const ARRAY_STRING_VALUE_1 = [KEYWORD_VALUE_1, KEYWORD_VALUE_2];
    const DATE_VALUE_1 = "2024-11-12T16:00:01.731455544-08:00";

    it("testPersistenceWorkflow", async () => {
        const client = newClient();
        const workflow = new BasicPersistenceWorkflow();
        const workflowId = uniqueId("basic-persistence-test-id");

        const runId = await client.startWorkflow(workflow, workflowId, 10, "start", {
            initialDataAttributes: new Map<string, unknown>([[TEST_INIT_DATA_OBJECT_KEY, "init-test-value"]]),
        });

        expect(await client.getSimpleWorkflowResult<string>(workflowId)).toBe("test-value-2");

        const byKey = await client.getWorkflowDataAttributes(
            workflow,
            workflowId,
            [
                TEST_INIT_DATA_OBJECT_KEY,
                TEST_DATA_OBJECT_KEY,
                `${TEST_DATA_OBJECT_PREFIX}1`,
                `${TEST_DATA_OBJECT_PREFIX}2`,
            ],
            runId,
        );
        expect(byKey.get(TEST_DATA_OBJECT_KEY)).toBe("query-start-query-decide");
        expect(byKey.get(TEST_INIT_DATA_OBJECT_KEY)).toBe("init-test-value");
        expect(byKey.get(`${TEST_DATA_OBJECT_PREFIX}1`)).toBe(11);
        expect(byKey.get(`${TEST_DATA_OBJECT_PREFIX}2`)).toBeUndefined();

        // ...and again without a runId.
        const byKeyNoRunId = await client.getWorkflowDataAttributes(workflow, workflowId, [TEST_DATA_OBJECT_KEY]);
        expect(byKeyNoRunId.get(TEST_DATA_OBJECT_KEY)).toBe("query-start-query-decide");

        // 5 keys: the 4 exactly-declared ones that were written, plus the prefix-declared "…prefix-1".
        // Before AUTOPLAT-1934 the prefix-declared key was filtered out and this returned 4.
        const all = await client.getAllWorkflowDataAttributes(workflow, workflowId, runId);
        expect(all.size).toBe(5);
        expect(all.get(TEST_DATA_OBJECT_KEY)).toBe("query-start-query-decide");
        expect(all.get(`${TEST_DATA_OBJECT_PREFIX}1`)).toBe(11);

        const allNoRunId = await client.getAllWorkflowDataAttributes(workflow, workflowId);
        expect(allNoRunId.size).toBe(5);
        expect(allNoRunId.get(TEST_DATA_OBJECT_KEY)).toBe("query-start-query-decide");

        const expectedSearchAttributes = {
            [TEST_SEARCH_ATTRIBUTE_INT]: 2,
            [TEST_SEARCH_ATTRIBUTE_KEYWORD]: "keyword-2",
        };
        const searchAttributes = await client.getWorkflowSearchAttributes(
            workflow,
            workflowId,
            [TEST_SEARCH_ATTRIBUTE_KEYWORD, TEST_SEARCH_ATTRIBUTE_INT],
            runId,
        );
        expect(Object.fromEntries(searchAttributes)).toEqual(expectedSearchAttributes);

        const searchAttributesNoRunId = await client.getWorkflowSearchAttributes(workflow, workflowId, [
            TEST_SEARCH_ATTRIBUTE_KEYWORD,
            TEST_SEARCH_ATTRIBUTE_INT,
        ]);
        expect(Object.fromEntries(searchAttributesNoRunId)).toEqual(expectedSearchAttributes);

        await client.waitForWorkflowCompletion(workflowId);

        // The server always returns datetimes in UTC (iwf issue #261), so this is the UTC rendering of
        // the state's "2023-04-17T21:17:49-00:00".
        const finalSearchAttributes = await client.getAllWorkflowSearchAttributes(workflow, workflowId);
        expect(Object.fromEntries(finalSearchAttributes)).toEqual({
            ...expectedSearchAttributes,
            [TEST_SEARCH_ATTRIBUTE_DATE_TIME]: "2023-04-17T21:17:49Z",
        });
    });

    it("testSetSearchAttributes", async () => {
        const client = newClient();
        const workflow = new SetSearchAttributeWorkflow();
        const workflowId = uniqueId("set-search-attribute-test-id");

        const runId = await client.startWorkflow(workflow, workflowId, 10, "start");

        await client.setWorkflowSearchAttributes(
            workflow,
            workflowId,
            new Map<string, SearchAttributeValue>([
                [SEARCH_ATTRIBUTE_KEYWORD, KEYWORD_VALUE_1],
                [SEARCH_ATTRIBUTE_TEXT, TEXT_VALUE_1],
                [SEARCH_ATTRIBUTE_DOUBLE, DOUBLE_VALUE_1],
                [SEARCH_ATTRIBUTE_INT, INTEGER_VALUE_1],
                [SEARCH_ATTRIBUTE_BOOL, BOOLEAN_VALUE_1],
                [SEARCH_ATTRIBUTE_KEYWORD_ARRAY, ARRAY_STRING_VALUE_1],
                [SEARCH_ATTRIBUTE_DATE_TIME, DATE_VALUE_1],
            ]),
        );

        // Wait for the workflow to close so the upserts have certainly been applied.
        await client.waitForWorkflowCompletion(workflowId);
        expect(await client.getSimpleWorkflowResult<string>(workflowId)).toBe("test-result");

        const returned = await client.getWorkflowSearchAttributes(
            workflow,
            workflowId,
            [
                SEARCH_ATTRIBUTE_KEYWORD,
                SEARCH_ATTRIBUTE_TEXT,
                SEARCH_ATTRIBUTE_DOUBLE,
                SEARCH_ATTRIBUTE_INT,
                SEARCH_ATTRIBUTE_BOOL,
                SEARCH_ATTRIBUTE_KEYWORD_ARRAY,
                SEARCH_ATTRIBUTE_DATE_TIME,
            ],
            runId,
        );

        expect(Object.fromEntries(returned)).toEqual({
            [SEARCH_ATTRIBUTE_KEYWORD]: KEYWORD_VALUE_1,
            [SEARCH_ATTRIBUTE_TEXT]: TEXT_VALUE_1,
            [SEARCH_ATTRIBUTE_DOUBLE]: DOUBLE_VALUE_1,
            [SEARCH_ATTRIBUTE_INT]: INTEGER_VALUE_1,
            [SEARCH_ATTRIBUTE_BOOL]: BOOLEAN_VALUE_1,
            [SEARCH_ATTRIBUTE_KEYWORD_ARRAY]: ARRAY_STRING_VALUE_1,
            // UTC rendering of DATE_VALUE_1 (iwf issue #261).
            [SEARCH_ATTRIBUTE_DATE_TIME]: "2024-11-13T00:00:01.731455544Z",
        });
    });

    it("testSetDataAttributes", async () => {
        const client = newClient();
        const workflow = new SetDataAttributeWorkflow();
        const workflowId = uniqueId("set-data-objects-test-id");

        const runId = await client.startWorkflow(workflow, workflowId, 10, "start");

        const prefixedKey = `${DATA_OBJECT_KEY_PREFIX}1`;
        const dataAttributes = new Map<string, unknown>([
            [DATA_OBJECT_KEY, "query-start"],
            [DATA_OBJECT_MODEL_KEY, { workflowId: "fake" }],
            [prefixedKey, 20],
        ]);

        await client.setWorkflowDataAttributes(workflowId, dataAttributes, runId);

        await client.waitForWorkflowCompletion(workflowId);
        expect(await client.getSimpleWorkflowResult<string>(workflowId)).toBe("test-result");

        const actual = await client.getWorkflowDataAttributes(workflow, workflowId, [
            DATA_OBJECT_KEY,
            DATA_OBJECT_MODEL_KEY,
            prefixedKey,
        ]);
        expect(Object.fromEntries(actual)).toEqual(Object.fromEntries(dataAttributes));
    });
});
