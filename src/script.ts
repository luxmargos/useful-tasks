import { z } from 'zod';

import { DEFAULT_REPLACE_REGEX, ReplaceRegexSchema } from './task_data';
import { TaskContentReplaceSchema } from './tasks/handleContentReplace';
import { TaskSubTasksSchema } from './tasks/handleSubTasks';
import { TaskFsMakeDirSchema } from './tasks/handleFsMkdir';
import { TaskFsDeleteSchema } from './tasks/handleFsDelete';
import { TaskFsCopySchema } from './tasks/handleFsCopy';
import { TaskOutputSchema } from './tasks/handleOutput';
import { TaskSetVarSchema } from './tasks/handleSetVar';
import { TaskTerminalCommandSchema } from './tasks/handleTerminalCommand';
import { TaskSymlinkSchema } from './tasks/handleFsSymlink';
import { TaskGitSetupSchema } from './tasks/handleGitRepoSetup';
import { CWD_RESTORE, CWD_KEEP } from './build_cli_parser';
import { logLevels } from './loggers';
import { TaskEnvVarSchema } from './tasks/handleEnvVar';
import { TaskFsTouchSchema } from './tasks/handleFsTouch';

export const TaskSchema = z.union([
  TaskGitSetupSchema,
  TaskTerminalCommandSchema,
  TaskSetVarSchema,
  TaskEnvVarSchema,
  TaskOutputSchema,
  TaskFsCopySchema,
  TaskFsDeleteSchema,
  TaskFsMakeDirSchema,
  TaskFsTouchSchema,
  TaskSymlinkSchema,
  TaskSubTasksSchema,
  TaskContentReplaceSchema,
]);

export type Task = z.infer<typeof TaskSchema>;
export type TaskInput = z.input<typeof TaskSchema>;
export type AnyRuntimeTask = RuntimeTask<Task>;
export type RuntimeTask<T extends Task> = T & {
  __compare__elements: string[];
};
export const TasksScriptSchema = z.object({
  /** The name of the tasks file */
  name: z.string().optional(),
  env: z
    .object({
      /** The specific log level for the tasks */
      logLevel: z.enum(logLevels).default('info'),

      /** The regex to replace text with variable values */
      varReplaceRegex: z
        .union([ReplaceRegexSchema, z.array(ReplaceRegexSchema)])
        .describe('The regex to replace text with variable values')
        .default([DEFAULT_REPLACE_REGEX])
        .transform((value) => {
          if (Array.isArray(value)) {
            return value.map((v) => new RegExp(v));
          } else {
            return [new RegExp(value)];
          }
        }),

      /** The regex to replace text with environment variable values */
      envReplaceRegex: z
        .union([ReplaceRegexSchema, z.array(ReplaceRegexSchema)])
        .describe('The regex to replace text with environment variable values')
        .default([DEFAULT_REPLACE_REGEX])
        .transform((value) => {
          if (Array.isArray(value)) {
            return value.map((v) => new RegExp(v));
          } else {
            return [new RegExp(value)];
          }
        }),

      cwdMode: z.union([z.literal(CWD_RESTORE), z.literal(CWD_KEEP)]).default(CWD_RESTORE),
    })
    .default({ logLevel: 'info', varReplaceRegex: DEFAULT_REPLACE_REGEX, envReplaceRegex: DEFAULT_REPLACE_REGEX }),
  tasks: z.array(TaskSchema).default([]),
});
export type TasksScript = z.infer<typeof TasksScriptSchema>;
export type TasksScriptInput = z.input<typeof TasksScriptSchema>;
