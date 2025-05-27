import { usefulTasks } from '@/useful_tasks';
import { prepare } from '@/build_cli_parser';
import { buildTestPath, prepareTestSuite, prepareTestInstance } from '@/__tests__/testUtils';
import fse from 'fs-extra';

describe('Custom var replacing with regex', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('Replace set-var with custom replace regex', async () => {
    const itObj = prepareTestInstance(testDir);

    const testFileA = itObj.buildTestPath('test-a.txt');
    const setupResult = prepare([]);
    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      {
        name: 'Sample',
        env: {
          logLevel: 'debug',
          varReplaceRegex: '##([a-zA-Z0-9\\.\\-_]*)##',
        },

        tasks: [
          {
            type: 'set-var',
            key: 'key_of_var',
            value: {
              a: 'value-a',
              b: 'value-b',
            },
            parser: 'auto',
          },
          {
            type: 'output',
            path: testFileA,
            text: 'I found a value key_of_var.a=##key_of_var.a## and key_of_var.b=##key_of_var.b##',
            target: 'fa',
          },
        ],
      },
      setupResult.program
    );

    const testAContent = fse.readFileSync(testFileA, 'utf-8');
    expect(testAContent).toBe('I found a value key_of_var.a=value-a and key_of_var.b=value-b');
  });
});
