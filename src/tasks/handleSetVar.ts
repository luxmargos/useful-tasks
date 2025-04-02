import fs from 'fs';
import { processWithGlobSync } from 'glob_handler';
import { logv } from 'loggers';
import path from 'path';
import { TaskContext, TaskSetVar } from 'task_data';
import { setTaskVar } from 'task_utils';
import {
  checkLegacyUsage,
  checkTypeOrThrow,
  checkEmptyStringOrThrow,
  loadFileOrThrow,
  parseJson,
  parseLines,
  resolveStringArray,
} from 'utils';

export const handleSetVar = async (context: TaskContext, task: TaskSetVar) => {
  checkLegacyUsage(task, 'var');
  checkLegacyUsage(task, 'varType');
  checkLegacyUsage(task, 'fileFormat');

  checkTypeOrThrow('key', task.key, ['string']);
  checkEmptyStringOrThrow('key', task.key);

  if (task.isFallback !== true) {
    task.isFallback = false;
  }
  const isFallback: boolean = task.isFallback;

  if (task.value !== undefined) {
    const value = task.value;
    setTaskVar(context, task.key, value, isFallback);
  }

  if (!task.src) return;
  checkTypeOrThrow('src', task.src, ['string']);

  const src = task.src as string;
  const parser = task.parser || 'auto';
  logv(`Parser = ${parser}`);

  const runFunc = (filePath: string) => {
    const varsPath = path.resolve(filePath);
    let obj: any | undefined;
    const content = loadFileOrThrow(varsPath);

    if (parser === 'auto' || parser === 'json') {
      try {
        logv('Trying to parse as JSON.');
        obj = parseJson(content);
      } catch (e) {
        if (parser === 'json') throw e;
      }
    }

    if (!obj && (parser === 'auto' || parser === 'lines')) {
      logv('Trying to parse as lines.');
      obj = parseLines(content);
    }

    if (!obj && (parser === 'auto' || parser === 'string')) {
      obj = content;
    }

    setTaskVar(context, task.key, obj, isFallback);
  };

  const runGlobSync = (items: string[]) => {
    for (const f of items) {
      const itemPath: string = path.join(src, f);
      if (fs.statSync(itemPath).isDirectory()) {
        continue;
      }
      runFunc(itemPath);
    }
  };

  // ignore dirs, include all files on empty filters
  const handled = processWithGlobSync(
    runGlobSync,
    src,
    resolveStringArray(task.include, []),
    resolveStringArray(task.exclude, []),
    true,
    true
  );

  // expect it is a single file
  if (!handled) {
    runFunc(src);
  }
};
