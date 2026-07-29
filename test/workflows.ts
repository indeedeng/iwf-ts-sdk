import { ObjectWorkflow, Registry } from "../iwf";
import { AbnormalExitWorkflow } from "./src/basic/abnormal-exit-workflow";
import { BasicWorkflow } from "./src/basic/basic-workflow";
import { EmptyInputWorkflow } from "./src/basic/empty-input-workflow";
import { MixOfWithWaitUntilAndSkipWaitUntilWorkflow } from "./src/basic/mix-of-with-wait-until-and-skip-wait-until-workflow";
import { ModelInputWorkflow } from "./src/basic/model-input-workflow";
import { ProceedOnStateStartFailWorkflow } from "./src/basic/proceed-on-state-start-fail-workflow";
import { AnyCommandCombinationFailWorkflow } from "./src/anycommandcombination/any-command-combination-fail-workflow";
import { SkipWaitUntilWorkflow } from "./src/basic/skip-wait-until-workflow";
import { ConditionalCompleteWorkflow } from "./src/conditional/conditional-complete-workflow";
import { ForceFailWorkflow } from "./src/forcefail/force-fail-workflow";
import {
    BasicInternalChannelWorkflow,
    WaitingInternalChannelWorkflow,
} from "./src/internalchannel/basic-internal-channel-workflow";
import { BasicPersistenceWorkflow } from "./src/persistence/basic-persistence-workflow";
import { SetDataAttributeWorkflow, SetSearchAttributeWorkflow } from "./src/persistence/set-attribute-workflows";
import { DeadEndStateWorkflow } from "./src/rpc/dead-end-state-workflow";
import { NoStartStateWorkflow } from "./src/rpc/no-start-state-workflow";
import { NoStateWorkflow } from "./src/rpc/no-state-workflow";
import { RpcLockingWorkflow } from "./src/rpc/rpc-locking-workflow";
import { RpcMemoWorkflow } from "./src/rpc/rpc-memo-workflow";
import { RpcWorkflow } from "./src/rpc/rpc-workflow";
import { BasicSignalWorkflow } from "./src/signal/basic-signal-workflow";
import { StateOptionsWorkflow } from "./src/stateoptions/state-options-workflow";
import { StateOptionsOverrideWorkflow } from "./src/stateoptionsoverride/state-options-override-workflow";
import {
    WorkflowBasicStateFail,
    WorkflowStateFailProceedToRecover,
    WorkflowStateFailProceedToRecoverNoWaitUntil,
} from "./src/stateapifail/workflow-basic-state-fail";
import { StateApiTimeoutFailWorkflow } from "./src/stateapitimeout/state-api-timeout-fail-workflow";
import { EmptyStateDecisionWorkflow } from "./src/statedecision/empty-state-decision-workflow";
import { BasicTimerWorkflow } from "./src/timer/basic-timer-workflow";

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
        new SkipWaitUntilWorkflow(),

        // persistence
        new BasicPersistenceWorkflow(),
        new SetDataAttributeWorkflow(),
        new SetSearchAttributeWorkflow(),

        // rpc
        new DeadEndStateWorkflow(),
        new NoStartStateWorkflow(),
        new NoStateWorkflow(),
        new RpcLockingWorkflow(),
        new RpcMemoWorkflow(),
        new RpcWorkflow(),

        // signal / failure modes
        new BasicSignalWorkflow(),
        new EmptyStateDecisionWorkflow(),
        new ForceFailWorkflow(),
        new StateApiTimeoutFailWorkflow(),
        new WorkflowBasicStateFail(),
        new WorkflowStateFailProceedToRecover(),
        new WorkflowStateFailProceedToRecoverNoWaitUntil(),

        // channels / conditional close
        new BasicInternalChannelWorkflow(),
        new ConditionalCompleteWorkflow(),
        new WaitingInternalChannelWorkflow(),

        // commands / state options
        new AnyCommandCombinationFailWorkflow(),
        new BasicTimerWorkflow(),
        new StateOptionsOverrideWorkflow(),
        new StateOptionsWorkflow(),
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
