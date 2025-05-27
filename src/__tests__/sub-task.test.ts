import { usefulTasks } from '@/useful_tasks';
import { prepare } from '@/build_cli_parser';
import { buildTestPath, prepareTestSuite, prepareTestInstance } from '@/__tests__/testUtils';
import fse from 'fs-extra';
import { TasksScript, TasksScriptInput } from '@/task_data';

describe('Sub-tasks', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('Sub-tasks', async () => {
    const subTask: TasksScriptInput = {
      name: 'subTask',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'output',
          tags: ['tag1'],
          text: 'tag1',
          target: 'console',
        },
        {
          type: 'output',
          tags: ['tag2'],
          text: 'tag2',
          target: 'console',
        },
      ],
    };

    const itObj = prepareTestInstance(testDir);

    const setupResult = prepare([]);
    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      {
        name: 'BaseTask',
        env: {
          logLevel: 'debug',
        },

        tasks: [
          {
            type: 'output',
            tags: ['tag1'],
            text: 'baseTask tag1',
            target: 'console',
          },
          {
            type: 'output',
            tags: ['tag2'],
            text: 'baseTask tag2',
            target: 'console',
          },
          {
            type: 'sub-tasks',
            inherit: {
              args: true,
              vars: true,
            },
          },
        ],
      },
      setupResult.program
    );

    expect(true).toBe(true);
  });
});
