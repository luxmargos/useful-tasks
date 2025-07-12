import { prepare } from '@/build_cli_parser';
import { prepareTestInstance, prepareTestSuite } from './testUtils';
import { usefulTasks } from '@/useful_tasks';
import { TasksScriptInput } from '@/script';
import { customAlphabet, nanoid } from 'nanoid';

const nanoAlphabet = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

describe('env-var', () => {
  const { testDir } = prepareTestSuite(__dirname);

  it('should set env vars', async () => {
    const itObj = prepareTestInstance(testDir);

    const keyA = nanoAlphabet();
    const keyB = nanoAlphabet();
    const keyC = nanoAlphabet();
    const keyD = nanoAlphabet();
    const keyX = nanoAlphabet();
    const keyY = nanoAlphabet();
    const keyZ = nanoAlphabet();

    const script: TasksScriptInput = {
      name: 'Test env-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'env-var',
          map: {
            [keyA]: 'a-value',
            [keyB]: 'b-value',
          },
        },
        {
          type: 'env-var',
          map: `${keyC}=c-value
${keyD} = $${keyC}`,
        },
        {
          type: 'output',
          text: `
${keyX}=X-Value
${keyY}=\${${keyX}}
${keyZ}=\\$${keyX}`,
          target: 'fw',
          path: '.env',
        },

        {
          type: 'env-var',
          src: '.env',
        },

        {
          type: 'output',
          text: `${keyA} , $${keyD}, \\${keyD}, ${keyD}`,
          target: 'console',
        },

        {
          type: 'output',
          text: `${keyA} , $${keyD}, \\${keyD}, ${keyD}`,
          target: 'fw',
          path: 'var_output.txt',
        },

        {
          type: 'output',
          text: `${keyX} , ${keyY}, ${keyZ}`,
          target: 'console',
        },
      ],
    };

    const setupResult = prepare([]);
    await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);

    expect(process.env[keyA]).toBe('a-value');
    expect(process.env[keyB]).toBe('b-value');
    expect(process.env[keyC]).toBe('c-value');
    expect(process.env[keyD]).toBe('c-value');
    expect(process.env[keyX]).toBe('X-Value');
    expect(process.env[keyY]).toBe('X-Value');
    expect(process.env[keyZ]).toBe(`\\$${keyX}`);
  });

  it('should set env vars', async () => {
    const itObj = prepareTestInstance(testDir);

    const keyA = nanoAlphabet();
    const keyB = nanoAlphabet();
    const keyXXX = nanoAlphabet();
    const script: TasksScriptInput = {
      name: 'Test env-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'env-var',
          map: {
            [keyA]: 'a-value',
            [keyB]: `$${keyXXX} b-value`,
          },
        },
      ],
    };

    const setupResult = prepare([]);
    await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);

    expect(process.env[keyA]).toBe('a-value');
    expect(process.env[keyB]).toBe(`$${keyXXX} b-value`);
  });

  it('value override', async () => {
    const itObj = prepareTestInstance(testDir);

    const keyA = nanoAlphabet();
    const keyB = nanoAlphabet();
    const keyC = nanoAlphabet();
    const script: TasksScriptInput = {
      name: 'Test env-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'env-var',
          map: `
            ${keyA}=a-value-old
            ${keyB}=$\{${keyA}\}
            ${keyA}=a-value-new
            ${keyC}=$\{${keyA}\}
          `,
        },
      ],
    };

    const setupResult = prepare([]);
    await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);

    expect(process.env[keyA]).toBe('a-value-new');
    expect(process.env[keyB]).toBe(`a-value-new`);
    expect(process.env[keyC]).toBe(`a-value-new`);
  });

  it('value override 2', async () => {
    const itObj = prepareTestInstance(testDir);

    // const keyA = 'A';
    // const keyB = 'B';
    // const keyC = 'C';

    const keyA = nanoAlphabet();
    const keyB = nanoAlphabet();
    const keyC = nanoAlphabet();
    const keyD = nanoAlphabet();
    const nonValuedKey = nanoAlphabet();

    const script: TasksScriptInput = {
      name: 'Test env-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'env-var',
          map: `
            ${keyA}=a-value-old
            ${keyB}=$\{${keyA}\}
            ${keyA}=a-value-new
            ${keyC}=$\{${keyA}\}
          `,
        },
        {
          type: 'env-var',
          map: `
            ${keyA}=a-value-override
            ${keyB}=$\{${keyA}\}
            ${keyC}=$\{${keyA}\}
            ${keyD}=$\{${nonValuedKey}\}
          `,
        },
      ],
    };

    const setupResult = prepare([]);
    await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);

    expect(process.env[keyA]).toBe('a-value-override');
    expect(process.env[keyB]).toBe(`a-value-override`);
    expect(process.env[keyC]).toBe(`a-value-override`);
    expect(process.env[keyD]).toBe(`\${${nonValuedKey}}`);
  });

  it('Single Env Var', async () => {
    const itObj = prepareTestInstance(testDir);

    const keyA = nanoAlphabet();
    const keyB = nanoAlphabet();
    const keyC = nanoAlphabet();
    const keyD = nanoAlphabet();

    const script: TasksScriptInput = {
      name: 'Test env-var',
      env: {
        logLevel: 'debug',
      },
      tasks: [
        {
          type: 'env-var',
          key: keyA,
          value: 'a-value',
        },
        {
          type: 'env-var',
          key: keyB,
          value: `$${keyA}`,
        },
      ],
    };

    const setupResult = prepare([]);
    await usefulTasks(itObj.instanceCwd, setupResult.opt, script, setupResult.program);

    expect(process.env[keyA]).toBe('a-value');
    expect(process.env[keyB]).toBe(`a-value`);
  });
});
