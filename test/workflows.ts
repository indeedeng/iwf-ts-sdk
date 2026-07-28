import { ObjectWorkflow, Registry } from "../iwf";
import { BasicWorkflow } from "./src/basic/basic-workflow";

/**
 * Every workflow the integ worker serves, mirroring the Java suite's global
 * `WorkflowRegistry.registry`. Both the worker app and the tests build their registry from this list,
 * so a workflow only ever has to be added in one place.
 */
export function allWorkflows(): ObjectWorkflow[] {
    return [new BasicWorkflow()];
}

/** A registry holding every test workflow. */
export function createRegistry(): Registry {
    const registry = new Registry();
    for (const workflow of allWorkflows()) {
        registry.addWorkflow(workflow);
    }
    return registry;
}
