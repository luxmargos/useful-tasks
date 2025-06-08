import stringArgv from 'string-argv';
import { newTaskSchemaWithGlobFilters, TaskContext } from '@/task_data';
import { initUsefulTasks } from '@/useful_tasks';
import { fillDefaultOptions, prepareOpts } from '@/build_cli_parser';
import fse from 'fs-extra';
import { processWithGlobSync } from '@/glob_handler';
import { resolveStringArray } from '@/utils';
import path from 'path';
import { cloneDeep, isNotNil, mergeWith } from 'es-toolkit';
import { z } from 'zod';

/**
 * Configuration for running a set of tasks as a sub-task group.
 * FUTURE: Add glob support for task file patterns
 */

export const TaskSubTasksSchema = newTaskSchemaWithGlobFilters('sub-tasks', {
  /** The path to the task file or directory to run as a sub-task group.*/
  src: z.string().nonempty(),

  /** Configuration for inheriting context from parent task. */
  shareArgs: z.boolean().default(true).describe('Whether to share args with the sub-tasks.'),
  shareVars: z.boolean().default(true).describe('Whether to share vars with the sub-tasks.'),

  /** Command-line arguments to pass to the sub-tasks. */
  args: z.string().default(''),
});
export type TaskSubTasks = z.infer<typeof TaskSubTasksSchema>;

// TODO: Implement glob filters, and entire process
export const handleSubTasks = async (context: TaskContext, task: TaskSubTasks) => {
  const subArgv = stringArgv(task.args);
  const setupResultFromArgs = prepareOpts(subArgv);

  const runFunc = async (scriptPath: string) => {
    if (fse.statSync(scriptPath).isDirectory()) {
      return;
    }

    const opts = cloneDeep(setupResultFromArgs.opts);
    if (task.shareArgs) {
      const mergedOpts = mergeWith(cloneDeep(context.opts), opts, (dest, src, key, target, source) => {
        if (Array.isArray(dest)) {
          if (isNotNil(src)) {
            if (Array.isArray(src)) return [...dest, ...src];
            return [...dest, src];
          }
          return dest;
        }

        if (isNotNil(src)) return src;
        return dest;
      });
      mergedOpts.cwd = opts.cwd;
      mergedOpts.extraMessages = opts.extraMessages;
      mergedOpts.script = scriptPath;

      if (mergedOpts.cwd) process.chdir(path.resolve(mergedOpts.cwd));
      await initUsefulTasks(
        context.originCwd,
        mergedOpts,
        setupResultFromArgs.program,
        task.shareVars ? context.vars : {}
      );
    } else {
      const requiredOpts = fillDefaultOptions(opts);
      requiredOpts.script = scriptPath;
      if (requiredOpts.cwd) process.chdir(path.resolve(requiredOpts.cwd));
      await initUsefulTasks(
        context.originCwd,
        requiredOpts,
        setupResultFromArgs.program,
        task.shareVars ? context.vars : {}
      );
    }
  };

  const runGlobSync = async (items: string[]) => {
    for (const f of items) {
      const p = path.isAbsolute(f) ? f : path.join(task.src, f);
      await runFunc(p);
    }
  };

  // ignore dirs, include all files on empty filters
  const handled = await processWithGlobSync(
    runGlobSync,
    task.src,
    resolveStringArray(task.include, []),
    resolveStringArray(task.exclude, []),
    true,
    true
  );

  if (!handled) {
    await runFunc(task.src);
  }
};
