import { describe, it, expect } from 'vitest';
import { buildTasksConfig, prepareTestSuite, prepareTestInstance } from './testUtils';
import { prepare } from '@/build_cli_parser';
import { usefulTasks } from '@/useful_tasks';
import fse from 'fs-extra';

describe('FS Mkdir Test', () => {
  const { testDir } = prepareTestSuite(__dirname, { clearDirAfter: false });

  it('MkdirTest', async () => {
    const itObj = prepareTestInstance(testDir);

    const dirName = 'TestDir';
    const setupResult = prepare(['--var-TEST=' + dirName]);

    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      buildTasksConfig([
        {
          type: 'fs-mkdir',
          path: '${TEST}',
        },
        {
          type: 'fs-mkdir',
          path: ['${TEST}/dir_1', '${TEST}/dir_2'],
        },
      ]),
      setupResult.program
    );

    const expectedDir = itObj.buildTestPath(dirName);
    expect(fse.existsSync(expectedDir)).toBe(true);

    const expectedDir2 = itObj.buildTestPath(dirName + '/dir_1');
    expect(fse.existsSync(expectedDir2)).toBe(true);

    const expectedDir3 = itObj.buildTestPath(dirName + '/dir_2');
    expect(fse.existsSync(expectedDir3)).toBe(true);
  });
});
