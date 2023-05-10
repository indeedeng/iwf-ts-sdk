"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
const waitUntilApiPath = "/api/v1/workflowState/start";
const decideApiPath = "/api/v1/workflowState/decide";
app.get('/', (req, res) => {
    res.send('Welcome to the homepage!');
});
app.post(waitUntilApiPath, (req, res) => {
    res.send('wait until api');
});
app.post(decideApiPath, (req, res) => {
    res.send('decide api');
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
