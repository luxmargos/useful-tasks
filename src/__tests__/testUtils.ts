import path from 'path';
import fse from 'fs-extra';
import { nanoid } from 'nanoid';
import { TasksScriptInput } from '@/script';
import { TaskInput } from '@/script';
import { beforeAll, afterAll, describe } from 'vitest';

export const removeTestOutputDir = (dirPath: string) => {
  fse.removeSync(dirPath);
};

export const prepareCwd = (cwd: string) => {
  process.chdir(cwd);
  return path.resolve(cwd);
};

export const buildTestPath = (dirPath: string, subPath?: string) => {
  if (subPath) {
    return [dirPath, subPath].join(path.sep);
  }

  return dirPath;
};

export const buildTasksConfig = (tasks: TaskInput[]): TasksScriptInput => {
  return {
    name: 'Sample',
    env: {
      logLevel: 'debug',
    },
    tasks: [...tasks],
  };
};

export const buildTaskConfigWithSampleTexts = (dirPath: string, tasks: TaskInput[]) => {
  const testText = `Replace TEST
    Special Characters : {}[].*()
    []
    []`;

  const testFileA = buildTestPath(dirPath, 'test-a.txt');
  const testFileB = buildTestPath(dirPath, 'test-b.txt');

  const commonTasks: TaskInput[] = [
    {
      type: 'fs-del',
      path: buildTestPath(dirPath),
    },
    {
      type: 'output',
      path: testFileA,
      text: testText,
      target: 'fw',
    },
    {
      type: 'output',
      path: testFileB,
      text: testText,
      target: 'fw',
    },
  ];

  const config = buildTasksConfig([...commonTasks, ...tasks]);

  return {
    config,
  };
};

export const prepareTestSuite = (baseDir: string, options?: { clearDirAfter?: boolean }, dirName = nanoid()) => {
  const baseDirAbsPath = path.resolve(baseDir);
  const testDirRelativePath = `test_${dirName}`;
  const testDirAbsPath = path.resolve(baseDirAbsPath, testDirRelativePath);

  beforeAll(() => {
    fse.mkdirpSync(testDirAbsPath);
    prepareCwd(testDirAbsPath);
  });

  afterAll(() => {
    process.chdir(baseDirAbsPath);
    if ((options?.clearDirAfter ?? true) && fse.existsSync(testDirAbsPath)) {
      removeTestOutputDir(testDirAbsPath);
    }
  });

  const buildTestPath = (subPath?: string) => {
    if (subPath) {
      return path.resolve(testDirAbsPath, subPath);
    }

    return testDirAbsPath;
  };

  return {
    testDir: testDirAbsPath,
    buildTestPath,
  };
};

export const prepareTestInstance = (parentDir: string, instanceDir = nanoid()) => {
  const instanceDirAbsPath = path.resolve(parentDir, instanceDir);
  fse.mkdirpSync(instanceDirAbsPath);
  const instanceCwd = prepareCwd(instanceDirAbsPath);

  const buildTestPath = (subPath?: string) => {
    if (subPath) {
      return path.resolve(instanceDirAbsPath, subPath);
    }

    return instanceDirAbsPath;
  };

  return {
    instanceCwd,
    buildTestPath,
  };
};
