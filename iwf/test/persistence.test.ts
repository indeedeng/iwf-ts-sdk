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
});
