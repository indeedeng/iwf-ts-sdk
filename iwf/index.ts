import { UnregisteredClient } from "./src/unregistered-client";

const clientOptions = {
    serverUrl: "http://localhost:8801",
    workerUrl: "http://localhost:8802"
}

const client = new UnregisteredClient(clientOptions);
client.startWorkflow("basic", "test", "state1", {encoding: '', data : 'start'}).then((workflowRunId) => {
    console.log(workflowRunId);
});
