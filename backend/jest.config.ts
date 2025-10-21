module.exports = {
  "testEnvironment": "node",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  "transform": {
    "^.+\\.(t|j)sx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  "moduleNameMapper": {
    "@/(.*)": "<rootDir>/src/$1"
  },
  "setupFiles": [
    "dotenv/config"
  ],
  "testTimeout": 10000,
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/config/**",
    "!src/migrations/**",
    "!src/seeders/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "clearMocks": true,
  "resetMocks": true,
  "restoreMocks": true,
  "preset": "ts-jest"
};