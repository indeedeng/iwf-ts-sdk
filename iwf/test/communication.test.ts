import { CommunicationImpl } from "../src/communication/communication";
import { StateMovement } from "../src/state-movement";
import { defaultObjectEncoder } from "../src/object-encoder";
import { InvalidArgumentError } from "../src/errors";

describe("CommunicationImpl.triggerStateMovements guard", () => {
    const movement = StateMovement.create("Next");

    it("throws when called outside an RPC (the default)", () => {
        const comm = new CommunicationImpl(defaultObjectEncoder);
        expect(() => comm.triggerStateMovements(movement)).toThrow(InvalidArgumentError);
    });

    it("allows triggering when permitted (RPC context)", () => {
        const comm = new CommunicationImpl(defaultObjectEncoder, undefined, undefined, undefined, undefined, true);
        expect(() => comm.triggerStateMovements(movement)).not.toThrow();
        expect(comm.getToTriggerStateMovements()).toHaveLength(1);
    });
});
