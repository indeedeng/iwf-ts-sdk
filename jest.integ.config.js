/** @type {import('ts-jest').JestConfigWithTsJest} */
// Integration tests: require a running iWF server (scripts/integ/docker-compose.yml).
// Kept separate from the unit suite so `npm test` stays fast and docker-free.
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.integ.test.ts"],
    // Some ported tests wait out a workflow/state timeout (~10s each), so 60s is too tight.
    testTimeout: 120000,
};
