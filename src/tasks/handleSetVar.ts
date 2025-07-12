import fs from 'fs';
import path from 'path';
import { processWithGlobSync } from '@/glob_handler';
import { logv } from '@/loggers';
import { newTaskSchemaWithGlobFilters, TaskContext } from '@/task_data';
import { replaceVarLiterals, replaceVarLiteralsForText, setTaskVar } from '@/task_utils';
import { loadFileOrThrow, parseJson, parseLines, resolveStringArray } from '@/utils';
import { isNil } from 'es-toolkit/compat';
import { z } from 'zod';

export const TaskSetVarSchema = newTaskSchemaWithGlobFilters('set-var', {
  key: z.string().nonempty(),
  value: z.union([z.string(), z.number(), z.boolean(), z.any()]),
  src: z.string().nonempty().optional(),
  parser: z.union([z.literal('json'), z.literal('lines'), z.literal('string'), z.literal('auto')]).default('auto'),
  /** If the variable already exists, assigning will be skipped */
  isFallback: z.boolean().default(false).describe('If the variable already exists, assigning will be skipped'),
});
export type TaskSetVar = z.infer<typeof TaskSetVarSchema>;

export const handleSetVar = async (context: TaskContext, task: TaskSetVar) => {
  const isFallback: boolean = task.isFallback;

  const handleForKeyValue = async (rootKey: string, value: any) => {
    if (typeof value === 'string') {
      const result = await replaceVarLiteralsForText(context.replaceProviders, value);
      setTaskVar(context, rootKey, result.valueOfKey, isFallback);
    } else if (typeof value === 'object' || Array.isArray(value)) {
      while (
        await replaceVarLiterals(
          0,
          context.replaceProviders,
          value,
          (obj, depth, key, valueOfKey) => {
            return true;
          },
          (obj, depth, key, valueOfKey) => {
            obj[key] = valueOfKey;
            // setTaskVar(context, rootKey, valueOfKey, isFallback);
          }
        )
      ) {}

      setTaskVar(context, rootKey, value, isFallback);
    } else {
      setTaskVar(context, rootKey, value, isFallback);
    }
  };
  if (task.value !== undefined) {
    const value = task.value;
    handleForKeyValue(task.key, value);
  }

  if (!task.src) return;

  const src = task.src;
  const parser = task.parser;
  logv(`Parser = ${parser}`);

  const runFunc = async (filePath: string) => {
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

    if (isNil(obj) && (parser === 'auto' || parser === 'lines')) {
      logv('Trying to parse as lines.');
      obj = parseLines(content);
    }

    if (isNil(obj) && (parser === 'auto' || parser === 'string')) {
      obj = content;
    }

    handleForKeyValue(task.key, obj);
  };

  const runGlobSync = async (items: string[]) => {
    for (const f of items) {
      const itemPath: string = path.isAbsolute(f) ? f : path.join(src, f);
      if (fs.statSync(itemPath).isDirectory()) {
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
