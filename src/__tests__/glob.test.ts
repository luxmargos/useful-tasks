import { globSync } from 'glob';
import { buildTasksConfig, buildTestPath, prepareTestSuite, prepareTestInstance } from './testUtils';
import { setup } from '@/build_cli_parser';
import os from 'os';
import { usefulTasks } from '@/useful_tasks';

describe('GlobTest', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('GlobSyncTest', async () => {
    const itObj = prepareTestInstance(testDir);

    const testFileA = itObj.buildTestPath('test-a.txt');
    const testFileB = itObj.buildTestPath('test-b.txt');

    const setupResult = setup([]);

    await usefulTasks(itObj.instanceCwd, setupResult.opt, buildTasksConfig([]), setupResult.program);

    const globResult1 = globSync(['**'], { ignore: [], cwd: itObj.instanceCwd, nodir: true }).filter(
      (item) => item !== '.'
    );
    const globResult2 = globSync(['*', '**/*'], { ignore: [], cwd: itObj.instanceCwd, nodir: true }).filter(
      (item) => item !== '.'
    );

    console.log('Glob Result:', globResult1, globResult2);
  });

  it('OS Test', () => {
    // console.log(os.cpus());
    console.log({ platform: os.platform(), arch: os.arch(), release: os.release() });
  });
});
