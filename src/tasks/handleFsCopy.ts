import { processWithGlobSync } from '../glob_handler';
import path from 'path';
import { TaskContext, TaskFsCopy } from '../task_data';
import { logi, logv } from '../loggers';
import fse from 'fs-extra';
import { resolveStringArray } from '../utils';

export const runCopy = (src: string, dst: string, options: fse.CopyOptionsSync) => {
  logv(`Copy: ${src} => ${dst}`);
  fse.copySync(src, dst, options);
};

export const handleFsCopy = async (context: TaskContext, task: TaskFsCopy) => {
  if (!fse.existsSync(task.src)) {
    throw new Error(`The source '${task.src}' does not exist`);
  }

  const conflict = task?.options?.conflict;
  let overwrite =
    conflict === undefined || conflict === null || (typeof conflict === 'string' && conflict.trim() === 'overwrite');

  /** @deprecated support migrate from '0.1.18' */
  if (task.options && 'overwrite' in task?.options && typeof task?.options?.overwrite === 'boolean') {
    overwrite = task.options.overwrite;
  }

  const cpOpt: fse.CopyOptionsSync = { overwrite };

  const runGlobSync = (items: string[]) => {
    for (const f of items) {
      const from = path.join(task.src, f);
      const to = path.join(task.dest, f);
      runCopy(from, to, cpOpt);
    }
  };

  // allow dir with glob, do nothing withtout filters
  const handled = await processWithGlobSync(
    runGlobSync,
    task.src,
    resolveStringArray(task.include, []),
    resolveStringArray(task.exclude, []),
    false,
    false
  );

  // copy the path is whatever
  if (!handled) {
    runCopy(task.src, task.dest, cpOpt);
  }
};
