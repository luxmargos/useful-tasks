import stringArgv from 'string-argv';
import { TaskContext, TaskSubTasks } from '../task_data';
import { initUsefulTasks, usefulTasks } from '../useful_tasks';
import { prepare } from '../build_cli_parser';
import fse from 'fs-extra';
import { logv } from '@/loggers';
import { processWithGlobSync } from '@/glob_handler';
import { resolveStringArray } from '@/utils';
import path from 'path';

// TODO: Implement glob filters, and entire process
export const handleSubTasks = async (context: TaskContext, task: TaskSubTasks) => {
  if (!task.args || typeof task.args !== 'string') {
    throw new Error(`Found missing or invalid property 'args' that is required`);
  }

  const subArgv = stringArgv(task.args);
  const setupResult = prepare(subArgv);

  // await usefulTasks(context.originCwd);
  await initUsefulTasks(context.originCwd, setupResult.opt, setupResult.program);

  const runGlobSync = async (items: string[]) => {
    for (const f of items) {
      const p = path.join(task.src, f);
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

  if (!handled) {
  }
};
