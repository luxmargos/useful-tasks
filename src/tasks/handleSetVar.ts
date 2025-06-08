import fs from 'fs';
import path from 'path';
import { processWithGlobSync } from '@/glob_handler';
import { logv } from '@/loggers';
import { newTaskSchemaWithGlobFilters, TaskContext } from '@/task_data';
import { replaceVarLiterals, setTaskVar } from '@/task_utils';
import {
  checkTypeOrThrow,
  checkEmptyStringOrThrow,
  loadFileOrThrow,
  parseJson,
  parseLines,
  resolveStringArray,
} from '@/utils';
import { isNil } from 'es-toolkit';
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

  if (task.value !== undefined) {
    const value = task.value;
    setTaskVar(context, task.key, value, isFallback);
    while (await replaceVarLiterals(context.replaceProviders, value)) {}
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

    setTaskVar(context, task.key, obj, isFallback);
    while (await replaceVarLiterals(context.replaceProviders, obj)) {}
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
