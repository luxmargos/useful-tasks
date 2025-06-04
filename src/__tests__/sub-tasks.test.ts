import { usefulTasks } from '@/useful_tasks';
import { prepare } from '@/build_cli_parser';
import { buildTestPath, prepareTestSuite, prepareTestInstance } from '@/__tests__/testUtils';
import fse from 'fs-extra';
import { TasksScript, TasksScriptInput, TasksScriptSchema } from '@/task_data';

describe('Sub-tasks', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('Sub-tasks', async () => {
    const itObj = prepareTestInstance(testDir);
    const subTaskPath = buildTestPath(itObj.instanceCwd, 'sub-task.json');

    fse.writeFileSync(
      subTaskPath,
      JSON.stringify({
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
      } satisfies TasksScriptInput),
      { encoding: 'utf-8' }
    );

    const setupResult = prepare(['--include', 'tag1']);
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
            tags: ['tag1'],
            shareArgs: true,
            shareVars: true,
            src: subTaskPath,
            args: '--include=tag2',
          },
        ],
      },
      setupResult.program
    );

    expect(true).toBe(true);
  });
});
