import { ObjectWorkflow, Registry } from "../iwf";
import { AbnormalExitWorkflow } from "./src/basic/abnormal-exit-workflow";
import { BasicWorkflow } from "./src/basic/basic-workflow";
import { EmptyInputWorkflow } from "./src/basic/empty-input-workflow";
import { MixOfWithWaitUntilAndSkipWaitUntilWorkflow } from "./src/basic/mix-of-with-wait-until-and-skip-wait-until-workflow";
import { ModelInputWorkflow } from "./src/basic/model-input-workflow";
import { ProceedOnStateStartFailWorkflow } from "./src/basic/proceed-on-state-start-fail-workflow";
import { DeadEndStateWorkflow } from "./src/rpc/dead-end-state-workflow";
import { NoStateWorkflow } from "./src/rpc/no-state-workflow";
import { RpcWorkflow } from "./src/rpc/rpc-workflow";

/**
 * Every workflow the integ worker serves, mirroring the Java suite's global
 * `WorkflowRegistry.registry`. Both the worker app and the tests build their registry from this list,
 * so a workflow only ever has to be added in one place.
 */
export function allWorkflows(): ObjectWorkflow[] {
    return [
        // basic
        new AbnormalExitWorkflow(),
        new BasicWorkflow(),
        new EmptyInputWorkflow(),
        new MixOfWithWaitUntilAndSkipWaitUntilWorkflow(),
        new ModelInputWorkflow(),
        new ProceedOnStateStartFailWorkflow(),

        // rpc
        new DeadEndStateWorkflow(),
        new NoStateWorkflow(),
        new RpcWorkflow(),
    ];
}

/** A registry holding every test workflow. */
export function createRegistry(): Registry {
    const registry = new Registry();
    for (const workflow of allWorkflows()) {
        registry.addWorkflow(workflow);
    }
    return registry;
}
