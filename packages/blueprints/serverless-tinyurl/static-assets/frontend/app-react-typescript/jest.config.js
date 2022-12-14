/** @type {import('ts-jest').JestConfigWithTsJest} */
const merge = require('merge');
const tsPreset = require('ts-jest/jest-preset');
const cloudscapePreset = require('@cloudscape-design/jest-preset');

module.exports = merge.recursive(tsPreset, cloudscapePreset, {
  modulePathIgnorePatterns: ['<rootDir>/cdk/'],
  transform: {
     "^.+\\.css$":"<rootDir>/node_modules/react-scripts/config/jest/cssTransform.js",
  },
  testEnvironment: "jsdom"
});
