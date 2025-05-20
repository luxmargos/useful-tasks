import fse from 'fs-extra';
import path from 'path';
import { processWithGlobSync } from '@/glob_handler';
import { logv } from '@/loggers';
import { TaskContext, TaskEnvVar } from '@/task_data';
import { setEnvVar } from '@/task_utils';
import {
  checkLegacyUsage,
  parseLines,
  checkTypeOrThrow,
  loadFileOrThrow,
  parseJson,
  resolveStringArray,
} from '@/utils';
import { isNotNil } from 'es-toolkit';
import { isArray } from 'es-toolkit/compat';

export const handleEnvVar = async (context: TaskContext, task: TaskEnvVar) => {
  checkLegacyUsage(task, 'var');
  checkLegacyUsage(task, 'varType');
  checkLegacyUsage(task, 'fileFormat');

  if (task.isFallback !== true) {
    task.isFallback = false;
  }
  const isFallback: boolean = task.isFallback;

  if (isNotNil(task.map)) {
    let map: any = task.map;
    if (typeof map === 'string') {
      logv('Trying to parse as lines.');
      map = parseLines(map);
    } else if (typeof map === 'object' || Array.isArray(map)) {
      Object.keys(map).forEach((key) => {
        setEnvVar(context, key, map[key], isFallback);
      });
    }
  }

  if (!task.src) return;

  checkTypeOrThrow('src', task.src, ['string']);
  const src = task.src as string;
  const parser = task.parser || 'auto';
  logv(`Parser = ${parser}`);

  const runFunc = (filePath: string) => {
    const varsPath = path.resolve(filePath);
    let obj: Record<string, any> | undefined;
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

    if (obj) {
      const finalObj = obj;
      Object.keys(finalObj).forEach((key) => {
        setEnvVar(context, key, finalObj[key], isFallback);
      });
    }
  };

  const runGlobSync = (items: string[]) => {
    for (const f of items) {
      const itemPath: string = path.join(src, f);

      if (fse.statSync(itemPath).isDirectory()) {
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
