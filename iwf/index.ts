import { UnregisteredClient } from "./src/unregistered-client";
import { UnregisteredWorkflowOptionsBuilder } from "./src/unregistered-workflow-options";

const clientOptions = {
    serverUrl: "http://localhost:8801",
    workerUrl: "http://localhost:8802"
}

const client = new UnregisteredClient(clientOptions);
client.startWorkflow(
    "basic", 
    "test", 
    "state1", 
    {encoding: '', data : 'start'}, 
    101,
    UnregisteredWorkflowOptionsBuilder.newBuilder().setCronSchedule("*/1 * * * *").build())
    .then((workflowRunId) => {
    console.log(workflowRunId);
});
