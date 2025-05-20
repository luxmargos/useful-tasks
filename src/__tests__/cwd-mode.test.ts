import { setup } from '@/build_cli_parser';
import { prepareTestSuite, prepareTestInstance } from './testUtils';
import { usefulTasks } from '@/useful_tasks';

describe('Test CWD modes', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('Keep Mode', async () => {
    const itObj = prepareTestInstance(testDir);

    const setupResult = setup([]);

    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      {
        name: 'Sample',
        env: {
          logLevel: 'debug',
          cwdMode: 'keep',
        },
        tasks: [
          {
            type: 'cmd',
            cmd: 'powershell pwd',
            when: {
              platform: 'win32',
            },
          },
          {
            type: 'cmd',
            cmd: 'pwd',
            when: {
              platform: '!win32',
            },
          },
          {
            type: 'output',
            target: 'fw',
            path: itObj.buildTestPath('output/cwd-mode-test.txt'),
            text: '',
          },
          {
            type: 'cmd',
            cmd: 'powershell pwd',
            cwd: 'output',
            when: {
              platform: 'win32',
            },
          },
          {
            type: 'cmd',
            cmd: 'pwd',
            cwd: 'output',
            when: {
              platform: '!win32',
            },
          },
          // expected pwd to be the same as before (output)
          {
            type: 'cmd',
            cmd: 'powershell pwd',
            when: {
              platform: 'win32',
            },
          },
          {
            type: 'cmd',
            cmd: 'pwd',
            when: {
              platform: '!win32',
            },
          },
        ],
      },
      setupResult.program
    );
  });

  it('Restore(default) Mode', async () => {
    const itObj = prepareTestInstance(testDir);

    const setupResult = setup([]);

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
            cmd: 'powershell pwd',
            when: {
              platform: 'win32',
            },
          },
          {
            type: 'cmd',
            cmd: 'pwd',
            when: {
              platform: '!win32',
            },
          },
          {
            type: 'output',
            target: 'fw',
            path: itObj.buildTestPath('output/cwd-mode-test.txt'),
            text: '',
          },
          {
            type: 'cmd',
            cmd: 'powershell pwd',
            cwd: 'output',
            when: {
              platform: 'win32',
            },
          },
          {
            type: 'cmd',
            cmd: 'pwd',
            cwd: 'output',
            when: {
              platform: '!win32',
            },
          },
          // expected pwd to be the same as before (output)
          {
            type: 'cmd',
            cmd: 'powershell pwd',
            when: {
              platform: 'win32',
            },
          },
          {
            type: 'cmd',
            cmd: 'pwd',
            when: {
              platform: '!win32',
            },
          },
        ],
      },
      setupResult.program
    );
  });
});
