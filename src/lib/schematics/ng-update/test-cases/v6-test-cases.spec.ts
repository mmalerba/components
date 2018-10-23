import {join} from 'path';
import {readFileContent, resolveBazelDataFile, runTestCases} from './index.spec';

describe('v6 upgrade test cases', () => {

  /**
   * Name of test cases that will be used to verify that update schematics properly update
   * a developers application.
   */
  const testCases = [
    'v6/attribute-selectors',
    'v6/class-names',
    'v6/css-names',
    'v6/element-selectors',
    'v6/input-names',
    'v6/output-names',
    'v6/property-names',
  ];

  let testCasesOutputPath: string;

  beforeAll(async () => {
    const testCaseInputs = testCases.reduce((inputs, testCaseName) => {
      inputs[testCaseName] = resolveBazelDataFile(`${testCaseName}_input.ts`);
      return inputs;
    }, {});

    const {tempPath} = await runTestCases('migration-v6', testCaseInputs);

    testCasesOutputPath = join(tempPath, 'projects/material/src/test-cases/');
  });

  // Iterates through every test case directory and generates a jasmine test block that will
  // verify that the update schematics properly updated the test input to the expected output.
  testCases.forEach(testCaseName => {
    const expectedOutputPath = resolveBazelDataFile(`${testCaseName}_expected_output.ts`);

    it(`should apply update schematics to test case: ${testCaseName}`, () => {
      expect(readFileContent(join(testCasesOutputPath, `${testCaseName}.ts`)))
        .toBe(readFileContent(expectedOutputPath));
    });
  });
});


