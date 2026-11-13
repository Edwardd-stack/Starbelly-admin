/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }] },
  globalSetup: "<rootDir>/tests/setup/globalSetup.ts",
  globalTeardown: "<rootDir>/tests/setup/globalTeardown.ts",
  testTimeout: 60000,
  maxWorkers: 1, // bitta in-memory baza — testlar ketma-ket
  forceExit: true, // session store ulanishi ochiq qoladi
};
