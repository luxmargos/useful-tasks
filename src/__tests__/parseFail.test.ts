import { prepare } from '@/build_cli_parser';
import { prepareTestInstance, prepareTestSuite } from './testUtils';
import { usefulTasks } from '@/useful_tasks';
import { TasksScriptInput } from '@/script';

describe('parse fail', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('should parse fail', async () => {
    const itObj = prepareTestInstance(testDir);

    const script: TasksScriptInput = {
      name: 'Test set-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        //@ts-ignore
        {},
      ],
    };

    const setupResult = prepare([]);
    let success = false;
    try {
      await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);
      success = true;
    } catch (e) {
      success = false;
    }

    expect(success).toBe(true);
  });
});
