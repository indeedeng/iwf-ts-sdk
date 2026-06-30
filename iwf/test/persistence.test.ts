import { PersistenceImpl } from "../src/persistence/persistence";
import { defaultObjectEncoder } from "../src/object-encoder";
import { SearchAttributeValueType } from "../../gen/iwfidl";

function newPersistence(): PersistenceImpl {
    return new PersistenceImpl(defaultObjectEncoder, new Map(), new Map(), new Map());
}

describe("PersistenceImpl", () => {
    it("reads back a written data attribute and exposes it as an upsert", () => {
        const p = newPersistence();
        p.setDataAttribute("user", { id: 1, name: "Ada" });

        expect(p.getDataAttribute("user")).toEqual({ id: 1, name: "Ada" });
        const upserts = p.getUpsertDataAttributes();
        expect(upserts).toHaveLength(1);
        expect(upserts[0].key).toBe("user");
    });

    it("reads from initial state when not overwritten", () => {
        const initial = new Map([["count", defaultObjectEncoder.encode(5)!]]);
        const p = new PersistenceImpl(defaultObjectEncoder, initial, new Map(), new Map());
        expect(p.getDataAttribute("count")).toBe(5);
    });

    it("handles each typed search attribute", () => {
        const p = newPersistence();
        p.setSearchAttributeInt("i", 42);
        p.setSearchAttributeDouble("d", 3.5);
        p.setSearchAttributeBoolean("b", true);
        p.setSearchAttributeKeyword("k", "kw");
        p.setSearchAttributeText("t", "text");
        p.setSearchAttributeDatetime("dt", "2026-06-24T00:00:00Z");
        p.setSearchAttributeKeywordArray("ka", ["x", "y"]);

        expect(p.getSearchAttributeInt("i")).toBe(42);
        expect(p.getSearchAttributeDouble("d")).toBe(3.5);
        expect(p.getSearchAttributeBoolean("b")).toBe(true);
        expect(p.getSearchAttributeKeyword("k")).toBe("kw");
        expect(p.getSearchAttributeText("t")).toBe("text");
        expect(p.getSearchAttributeDatetime("dt")).toBe("2026-06-24T00:00:00Z");
        expect(p.getSearchAttributeKeywordArray("ka")).toEqual(["x", "y"]);

        const upserts = p.getUpsertSearchAttributes();
        expect(upserts).toHaveLength(7);
        expect(upserts.find((sa) => sa.key === "i")?.valueType).toBe(SearchAttributeValueType.Int);
        expect(upserts.find((sa) => sa.key === "ka")?.valueType).toBe(SearchAttributeValueType.KeywordArray);
    });

    it("tracks state locals and recorded events separately", () => {
        const p = newPersistence();
        p.setStateExecutionLocal("local", "v");
        p.recordEvent("event", { kind: "test" });

        expect(p.getStateExecutionLocal("local")).toBe("v");
        expect(p.getUpsertStateLocals()).toHaveLength(1);
        expect(p.getRecordEvents()).toHaveLength(1);
    });

    describe("data-attribute key validation", () => {
        // Accept exact key "user" or any key starting with "cache_".
        const isValid = (key: string): boolean => key === "user" || key.startsWith("cache_");
        const withValidator = (): PersistenceImpl =>
            new PersistenceImpl(defaultObjectEncoder, new Map(), new Map(), new Map(), isValid);

        it("allows declared exact and prefix keys", () => {
            const p = withValidator();
            expect(() => p.setDataAttribute("user", 1)).not.toThrow();
            expect(() => p.setDataAttribute("cache_42", 1)).not.toThrow();
            expect(p.getDataAttribute("cache_42")).toBe(1);
        });

        it("rejects an undeclared key on set and get", () => {
            const p = withValidator();
            expect(() => p.setDataAttribute("nope", 1)).toThrow(/Data attribute nope is not declared/);
            expect(() => p.getDataAttribute("nope")).toThrow(/Data attribute nope is not declared/);
        });

        it("skips validation when no validator is provided", () => {
            const p = newPersistence();
            expect(() => p.setDataAttribute("anything", 1)).not.toThrow();
        });
    });

    describe("search-attribute type validation", () => {
        // "score" is declared as Int; everything else is undeclared.
        const saType = (key: string): SearchAttributeValueType | undefined =>
            key === "score" ? SearchAttributeValueType.Int : undefined;
        const withSaTypes = (): PersistenceImpl =>
            new PersistenceImpl(defaultObjectEncoder, new Map(), new Map(), new Map(), undefined, saType);

        it("allows setting a declared search attribute of the matching type", () => {
            expect(() => withSaTypes().setSearchAttributeInt("score", 1)).not.toThrow();
        });

        it("rejects an undeclared search attribute", () => {
            expect(() => withSaTypes().setSearchAttributeInt("nope", 1)).toThrow(/not declared/);
        });

        it("rejects setting a declared search attribute as the wrong type", () => {
            expect(() => withSaTypes().setSearchAttributeKeyword("score", "x")).toThrow(/declared as/);
        });
    });

    describe("recordEvent", () => {
        it("rejects a duplicate event key within one execution", () => {
            const p = newPersistence();
            p.recordEvent("e", 1);
            expect(() => p.recordEvent("e", 2)).toThrow(/already been recorded/);
        });
    });

    describe("int64 precision + datetime format", () => {
        it("rejects an int search attribute beyond safe-integer range", () => {
            const p = newPersistence();
            expect(() => p.setSearchAttributeInt("i", Number.MAX_SAFE_INTEGER + 1)).toThrow(/safe integer/);
            expect(() => p.setSearchAttributeInt("i", 42)).not.toThrow();
        });

        it("accepts epoch-seconds and RFC3339 datetimes, rejects garbage", () => {
            const p = newPersistence();
            expect(() => p.setSearchAttributeDatetime("dt", "1717200000")).not.toThrow();
            expect(() => p.setSearchAttributeDatetime("dt", "2006-01-02T15:04:05-07:00")).not.toThrow();
            expect(() => p.setSearchAttributeDatetime("dt", "not-a-date")).toThrow(/not a valid datetime/);
        });
    });
});
