import { prepare } from '@/build_cli_parser';
import { prepareTestInstance, prepareTestSuite } from './testUtils';
import { usefulTasks } from '@/useful_tasks';
import { TasksScriptInput } from '@/script';
import { TaskEnvVarIn } from '@/tasks/handleEnvVar';

describe('env-var', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('should set env vars', async () => {
    const itObj = prepareTestInstance(testDir);

    const script: TasksScriptInput = {
      name: 'Test env-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'env-var',
          map: {
            a: 'a-value',
            b: 'b-value',
          },
        } satisfies TaskEnvVarIn,
        {
          type: 'env-var',
          map: `c=c-value
d = $c`,
        },
        {
          type: 'output',
          text: `
X=X-Value
Y=$X
Z=\\$X`,
          target: 'fw',
          path: '.env',
        },

        {
          type: 'output',
          text: '${a} , $d, \\${d}, ${d}',
          target: 'console',
        },

        {
          type: 'output',
          text: '${a} , $d, \\${d}, ${d}',
          target: 'fw',
          path: 'var_output.txt',
        },

        {
          type: 'output',
          text: '${X} , ${Y}, ${Z}',
          target: 'console',
        },
      ],
    };

    const setupResult = prepare([]);
    await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);
  });
});
