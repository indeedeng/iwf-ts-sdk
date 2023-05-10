import express from 'express';

const app = express();
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
