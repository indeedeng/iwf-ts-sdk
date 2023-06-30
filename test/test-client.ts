import { UnregisteredClient } from "../iwf/src/unregistered-client";
import { UnregisteredWorkflowOptionsBuilder } from "../iwf/src/unregistered-workflow-options";

const clientOptions = {
    serverUrl: "http://localhost:8801",
    workerUrl: "http://localhost:8802"
}

const client = new UnregisteredClient(clientOptions);
const workflowRunId = client.startWorkflow(
    "basic", 
    "testGet", 
    "state1", 
    {encoding: '', data : 'start'}, 
    101,
    UnregisteredWorkflowOptionsBuilder.newBuilder().build())
    .then((workflowRunId) => {
        console.log(workflowRunId);
        return client.getSimpleWorkflowResultWithWait("testGet", workflowRunId)
    }).then((result) => {
        console.log(result);
    });
