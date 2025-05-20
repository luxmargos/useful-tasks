import { usefulTasks } from '@/useful_tasks';
import { setup } from '@/build_cli_parser';
import { buildTasksConfig, prepareTestSuite, prepareTestInstance as prepareTest } from '@/__tests__/testUtils';
import fse from 'fs-extra';
import { TaskInput } from '@/task_data';

describe('Content replacing using glob', () => {
  const { testDir } = prepareTestSuite(__dirname);

  const testText = `Replace TEST
Special Characters : {}[].*()
[]
[]`;

  it('Replace basic', async () => {
    const testAExpectedText = `Replace TEST
Special Characters : {}**REPLACED**.*()
**REPLACED**
[]`;

    const testBExpectedText = `Replace TE**REPLACED**T
**REPLACED**pecial Character**REPLACED** : {}[].*()
[]
[]`;

    const itObj = prepareTest(testDir);
    const testFileA = itObj.buildTestPath('test-a.txt');
    const testFileB = itObj.buildTestPath('test-b.txt');

    const setupResult = setup([]);
    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      buildTasksConfig([
        {
          type: 'output',
          path: testFileA,
          text: testText,
          target: 'fw',
        },
        {
          type: 'output',
          path: testFileB,
          text: testText,
          target: 'fw',
        },
        {
          type: 'content-replace',
          comment: 'Replacement with pure text',
          path: testFileA,
          find: '[]',
          replace: '**REPLACED**',
          loop: 2,
        },
        {
          type: 'content-replace',
          comment: 'Replacement with Regex',
          path: testFileB,
          find: {
            pattern: 's',
            flags: 'gi',
          },
          replace: '**REPLACED**',
        },
      ]),
      setupResult.program
    );

    const testAContent = fse.readFileSync(testFileA, 'utf-8');
    const testBContent = fse.readFileSync(testFileB, 'utf-8');
    expect(testAContent).toBe(testAExpectedText);
    expect(testBContent).toBe(testBExpectedText);
  });

  it('Replace with glob', async () => {
    const testAExpectedText = `Replace TEST
Special Characters : {}**REPLACED**.*()
**REPLACED**
[]`;

    const testBExpectedText = testText;

    const itObj = prepareTest(testDir);
    const testFileA = itObj.buildTestPath('test-a.txt');
    const testFileB = itObj.buildTestPath('test-b.txt');

    const setupResult = setup([]);
    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      buildTasksConfig([
        {
          type: 'output',
          path: testFileA,
          text: testText,
          target: 'fw',
        },
        {
          type: 'output',
          path: testFileB,
          text: testText,
          target: 'fw',
        },
        {
          type: 'content-replace',
          comment: 'Replacement with Regex',
          path: itObj.buildTestPath(),
          find: '[]',
          replace: '**REPLACED**',
          loop: 2,
          exclude: ['*b.txt'],
        },
      ]),
      setupResult.program
    );

    const testAContent = fse.readFileSync(testFileA, 'utf-8');
    const testBContent = fse.readFileSync(testFileB, 'utf-8');
    expect(testAContent).toBe(testAExpectedText);
    expect(testBContent).toBe(testBExpectedText);
  });
});
