import { prepare } from '@/build_cli_parser';
import { prepareTestSuite, prepareTestInstance } from './testUtils';
import { usefulTasks } from '@/useful_tasks';
import fse from 'fs-extra';
import { buildTestPath } from './testUtils';

describe('Test cmd', () => {
  const { testDir } = prepareTestSuite(__dirname, true);

  it('Simple', async () => {
    const itObj = prepareTestInstance(testDir);
    const setupResult = prepare([]);

    const testContent = `Hello ${process.platform}`;
    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      {
        name: 'Sample',
        env: {
          logLevel: 'debug',
        },
        tasks: [
          {
            type: 'cmd',
            cmd: `echo "${testContent}" > test.txt`,
            when: { platform: '!win32' },
          },
          {
            type: 'cmd',
            cmd: `echo "${testContent}" > test.txt`,
            when: { platform: 'win32' },
          },
        ],
      },
      setupResult.program
    );

    const testFileContent = fse.readFileSync(buildTestPath(itObj.instanceCwd, 'test.txt'), 'utf-8').trim();
    expect(testFileContent).toBe(testContent);
  });
});
