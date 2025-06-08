import fs from 'fs';
import path from 'path';
import { TaskContext, RegexData, newTaskSchemaWithGlobFilters, RegexDataSchema } from '@/task_data';
import { logv } from '@/loggers';
import { processWithGlobSync } from '@/glob_handler';
import { resolveStringArray, throwInvalidParamError } from '@/utils';
import { z } from 'zod';

export const TaskContentFindSchema = z.union([z.string().nonempty(), RegexDataSchema]);
export const TaskContentReplaceSchema = newTaskSchemaWithGlobFilters('content-replace', {
  path: z
    .string()
    .nonempty()
    .describe(
      `If the task includes 'include' or 'exclude', \
      it will be handled as a directory. 
      Otherwise, it will be processed as a file.`
    ),
  find: TaskContentFindSchema,
  replace: z.string(),
  loop: z.number().optional(),
});
export type TaskContentReplace = z.infer<typeof TaskContentReplaceSchema>;

const runFindAndReplaceWithRegex = (content: string, find: RegExp, replace: string, repeat: number): string => {
  var text: string = content;
  if (repeat < 0) {
    while (find.test(text)) {
      text = text.replace(find, replace);
    }
  } else {
    for (var i = 0; i < repeat; i++) {
      if (find.test(text)) {
        text = text.replace(find, replace);
      }
    }
  }
  return text;
};

const runFindAndReplaceWithText = (content: string, find: string, replace: string, repeat: number): string => {
  var text: string = content;
  if (repeat < 1) {
    while (text.indexOf(find) >= 0) {
      text = text.replace(find, replace);
    }
  } else {
    for (var i = 0; i < repeat; i++) {
      if (text.indexOf(find) >= 0) {
        text = text.replace(find, replace);
      }
    }
  }
  return text;
};

const isRegexData = (v: any) => {
  if (v !== undefined && v !== null && typeof v === 'object' && 'pattern' in v && typeof v.pattern === 'string') {
    return true;
  }
  return false;
};

type FindAndReplaceFunc = (content: string, find: any, replace: string, repeat: number) => string;

const findAndReplaceWithFile = (
  path: string,
  replaceFunc: FindAndReplaceFunc,
  find: string | RegExp,
  replace: string,
  repeat: number
) => {
  logv(`Find and Replace: ${path}`);
  const content: string = fs.readFileSync(path, 'utf-8');
  const newContent = replaceFunc(content, find, replace, repeat);
  fs.writeFileSync(path, newContent, 'utf-8');
};

export const handleContentReplace = async (context: TaskContext, task: TaskContentReplace) => {
  if (!fs.existsSync(task.path)) {
    logv(`The '${task.path}' does not exist`);
    return;
  }

  if (task.replace === undefined || typeof task.replace !== 'string') {
    throwInvalidParamError(task, 'replace');
  }

  let loop: number = task.loop === undefined || task.loop === null ? 1 : task.loop;
  if (typeof loop === 'string') {
    loop = parseInt(loop, 10);
  } else if (typeof loop !== 'number') {
    throwInvalidParamError(task, 'loop');
  }

  let find: string | RegExp;
  let replaceFunc: FindAndReplaceFunc;
  if (isRegexData(task.find)) {
    const regexData = task.find as RegexData;
    find = new RegExp(regexData.pattern, regexData.flags);
    replaceFunc = runFindAndReplaceWithRegex;
  } else if (typeof task.find === 'string') {
    find = task.find;
    replaceFunc = runFindAndReplaceWithText;
  } else {
    throwInvalidParamError(task, 'find');
    return;
  }

  const runGlobSync = (items: string[]) => {
    for (const f of items) {
      const itemPath: string = path.isAbsolute(f) ? f : path.join(task.path, f);

      if (fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory()) {
        continue;
      }

      findAndReplaceWithFile(itemPath, replaceFunc, find, task.replace, loop);
    }
  };

  // ignore dirs, include all files on empty filters
  const handled = await processWithGlobSync(
    runGlobSync,
    task.path,
    resolveStringArray(task.include, []),
    resolveStringArray(task.exclude, []),
    true,
    true
  );

  // expect it is a single file
  if (!handled) {
    findAndReplaceWithFile(task.path, replaceFunc, find, task.replace, loop);
  }
};
