/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/iwf"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: ["iwf/src/**/*.ts"],
};
