"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unregistered_client_1 = require("./src/unregistered-client");
const clientOptions = {
    serverUrl: "http://localhost:8801",
    workerUrl: "http://localhost:8802"
};
const client = new unregistered_client_1.UnregisteredClient(clientOptions);
client.startWorkflow("test", "test", "test", {}).then((workflowRunId) => {
    console.log(workflowRunId);
});
