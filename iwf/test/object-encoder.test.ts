import { JsonObjectEncoder, defaultObjectEncoder } from "../src/object-encoder";

describe("JsonObjectEncoder", () => {
    const encoder = new JsonObjectEncoder();

    it("round-trips an object", () => {
        const value = { a: 1, b: "two", c: [3, 4] };
        const encoded = encoder.encode(value);
        expect(encoded).toEqual({ encoding: "json", data: JSON.stringify(value) });
        expect(encoder.decode(encoded)).toEqual(value);
    });

    it("encodes undefined as undefined", () => {
        expect(encoder.encode(undefined)).toBeUndefined();
    });

    it("decodes undefined / empty payloads as undefined", () => {
        expect(encoder.decode(undefined)).toBeUndefined();
        expect(encoder.decode({ encoding: "json" })).toBeUndefined();
    });

    it("decodes empty-string data as undefined instead of throwing", () => {
        expect(encoder.decode({ encoding: "json", data: "" })).toBeUndefined();
    });

    it("exposes a default encoder", () => {
        expect(defaultObjectEncoder.encodingType).toBe("json");
    });
});
