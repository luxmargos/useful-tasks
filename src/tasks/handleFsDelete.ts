import fs from 'fs';
import path from 'path';
// import { removeSync } from 'fs-extra';
import fse from 'fs-extra';

import { processWithGlobSync } from '@/glob_handler';
import { logi, logv } from '@/loggers';
import { TaskContext, TaskFsDelete } from '@/task_data';
import { resolveStringArray } from '@/utils';

export const runDelete = (path: string) => {
  logv(`Delete: ${path}`);
  fse.removeSync(path);
};

export const handleFsDelete = async (context: TaskContext, task: TaskFsDelete) => {
  if (!fs.existsSync(task.path)) {
    logi(`The '${task.path}' does not exist and cannot be deleted`);
    return;
  }

  const runGlobSync = (items: string[]) => {
    for (const f of items) {
      runDelete(path.isAbsolute(f) ? f : path.join(task.path, f));
    }
  };

  // allow dir with glob, do nothing withtout filters
  const handled = await processWithGlobSync(
    runGlobSync,
    task.path,
    resolveStringArray(task.include, []),
    resolveStringArray(task.exclude, []),
    false,
    false
  );

  // delete the path is whatever
  if (!handled) {
    runDelete(task.path);
  }
};
