import fse from 'fs-extra';
import path from 'path';
import { processWithGlobSync } from '@/glob_handler';
import { logv } from '@/loggers';
import { DEFAULT_REPLACE_REGEX_TRADITIONAL, TaskContext, TaskEnvVar } from '@/task_data';
import { replaceVarLiterals, setEnvVar } from '@/task_utils';
import { parseLines, checkTypeOrThrow, loadFileOrThrow, parseJson, resolveStringArray } from '@/utils';
import { isNil, isNotNil } from 'es-toolkit';
import { get } from 'es-toolkit/compat';

const traditionalProviders = [
  { regex: new RegExp(DEFAULT_REPLACE_REGEX_TRADITIONAL), store: (varPath: string) => get(process.env, varPath) },
];

export const handleEnvVar = async (context: TaskContext, task: TaskEnvVar) => {
  const isFallback: boolean = task.isFallback;

  // The env-var task treat $ENV_VAR as a var literal
  const replaceProviders = [...context.replaceProviders, ...traditionalProviders];

  if (isNotNil(task.map)) {
    let map: any = task.map;
    if (typeof map === 'string') {
      logv('Trying to parse as lines.');
      map = parseLines(map);
    }

    if (typeof map === 'object' || Array.isArray(map)) {
      const keys = Object.keys(map);
      for (const key of keys) {
        setEnvVar(context, key, map[key], isFallback);
        // this assumes map has including another var literals
        // so it will replace var literals in the map, until no more changes
        while (await replaceVarLiterals(replaceProviders, map)) {}
      }
    }
  }

  if (!task.src) return;

  checkTypeOrThrow('src', task.src, ['string']);
  const src = task.src as string;
  const parser = task.parser || 'auto';
  logv(`Parser = ${parser}`);

  const runFunc = async (filePath: string) => {
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

    if (isNil(obj) && (parser === 'auto' || parser === 'lines')) {
      logv('Trying to parse as lines.');
      obj = parseLines(content);
    }

    if (obj) {
      const finalObj = obj;
      const keys = Object.keys(finalObj);
      for (const key of keys) {
        setEnvVar(context, key, finalObj[key], isFallback);
        // this assumes finalObj has including another var literals
        // so it will replace var literals in the finalObj, until no more changes
        while (await replaceVarLiterals(replaceProviders, finalObj)) {}
      }
    }
  };

  const runGlobSync = async (items: string[]) => {
    for (const f of items) {
      const itemPath: string = path.join(src, f);

      if (fse.statSync(itemPath).isDirectory()) {
        continue;
      }
      await runFunc(itemPath);
    }
  };

  // ignore dirs, include all files on empty filters
  const handled = await processWithGlobSync(
    runGlobSync,
    src,
    resolveStringArray(task.include, []),
    resolveStringArray(task.exclude, []),
    true,
    true
  );

  // expect it is a single file
  if (!handled) {
    await runFunc(src);
  }
};
