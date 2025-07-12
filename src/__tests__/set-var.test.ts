import { prepare } from '@/build_cli_parser';
import { prepareTestInstance, prepareTestSuite } from './testUtils';
import { usefulTasks } from '@/useful_tasks';
import { TasksScriptInput } from '@/script';
import { customAlphabet, nanoid } from 'nanoid';
import fse from 'fs-extra';

const nanoAlphabet = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

describe('set-var', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('should set vars', async () => {
    const itObj = prepareTestInstance(testDir);

    const script: TasksScriptInput = {
      name: 'Test set-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'set-var',
          key: 'key_of_var',
          value: {
            keyA: 'a-value',
            keyB: '${key_of_var.keyA}',
          },
        },
        {
          type: 'output',
          text: '${key_of_var.keyA}',
          target: 'fw',
          path: 'var_output_a.txt',
        },
        {
          type: 'output',
          text: '${key_of_var.keyB}',
          target: 'fw',
          path: 'var_output_b.txt',
        },
        {
          type: 'output',
          text: '${key_of_var.keyC}',
          target: 'fw',
          path: 'var_output_c.txt',
        },
      ],
    };

    const setupResult = prepare([]);
    await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);

    const outputA = fse.readFileSync(itObj.buildTestPath('var_output_a.txt'), 'utf-8');
    const outputB = fse.readFileSync(itObj.buildTestPath('var_output_b.txt'), 'utf-8');
    const outputC = fse.readFileSync(itObj.buildTestPath('var_output_c.txt'), 'utf-8');
    expect(outputA).toBe('a-value');
    expect(outputB).toBe('a-value');
    expect(outputC).toBe('${key_of_var.keyC}');
  });
});
