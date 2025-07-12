import fse from 'fs-extra';
import path from 'path';
import { processWithGlobSync } from '@/glob_handler';
import { logv } from '@/loggers';
import {
  DEFAULT_REPLACE_REGEX_TRADITIONAL,
  newTaskSchema,
  newTaskSchemaWithGlobFilters,
  TaskContext,
} from '@/task_data';
import { replaceVarLiterals, setEnvVar } from '@/task_utils';
import { parseLines, loadFileOrThrow, parseJson, resolveStringArray } from '@/utils';
import { isNil, omit } from 'es-toolkit/compat';
import { get } from 'es-toolkit/compat';
import { z } from 'zod';

const EnvVarMap = z.union([z.string(), z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))]);
export const TaskEnvVarSchemaBase = newTaskSchemaWithGlobFilters('env-var', {
  key: z.string().nonempty().optional(),
  value: z.string().optional(),
  map: EnvVarMap.optional(),
  src: z.string().nonempty().optional(),
  parser: z.union([z.literal('json'), z.literal('lines'), z.literal('auto')]).default('auto'),
  /** If the environment variable already exists, assigning will be skipped */
  isFallback: z
    .boolean()
    .default(false)
    .describe('If the environment variable already exists, assigning will be skipped'),
});

const TaskEnvVarSchema = TaskEnvVarSchemaBase.superRefine((data, ctx) => {
  const hasKv = data.key !== undefined;
  const hasMap = data.map !== undefined || data.src !== undefined;

  if (hasKv && hasMap) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cannot have both key/value and map/src properties.',
    });
  }

  if (!hasKv && !hasMap) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Must have either key/value or map/src properties.',
    });
  }

  if (hasKv && data.value === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '`value` is required when `key` is provided.',
      path: ['value'],
    });
  }
}).transform((data) => {
  if (!isNil(data.key) && !isNil(data.value) && isNil(data.map)) {
    return {
      ...data,
      map: {
        [data.key]: data.value,
      },
    };
  }

  return data;
});

export type TaskEnvVarBase = z.infer<typeof TaskEnvVarSchemaBase>;
export type TaskEnvVarBaseIn = z.input<typeof TaskEnvVarSchemaBase>;

const traditionalProviders = [
  { regex: new RegExp(DEFAULT_REPLACE_REGEX_TRADITIONAL), store: (varPath: string) => get(process.env, varPath) },
];

export const handleEnvVar = async (context: TaskContext, task: TaskEnvVarBase) => {
  const refinedTask = TaskEnvVarSchema.parse(task);
  const isFallback: boolean = task.isFallback;

  // The env-var task treat $ENV_VAR as a var literal
  const replaceProviders = [...context.replaceProviders, ...traditionalProviders];

  if (isNil(task.src) && !isNil(refinedTask.map)) {
    let map: any = refinedTask.map;
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

  if (isNil(task.src)) return;

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
      const itemPath: string = path.isAbsolute(f) ? f : path.join(src, f);

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
