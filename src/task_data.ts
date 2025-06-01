import { Command } from 'commander';
import { CWD_KEEP, CWD_RESTORE, Options } from './build_cli_parser';
import { logLevels } from './loggers';
import { z, ZodObject, ZodRawShape } from 'zod';
import os from 'os';
import { omit } from 'es-toolkit';

// TODO: Unescaping is required

/** e.g. Match: "Text...${value.key}...", Does not match: "Text...\$value.key..." */
/** e.g. Match: "Text...${value.key}...", Does not match: "Text...\\${value.key}..." */
export const DEFAULT_REPLACE_REGEX = '(?<!\\\\)\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}';
//Keep: export const DEFAULT_REPLACE_REGEX = '\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}';

// TODO: Unescaping is required
/** e.g. Match: "Text...$value.key...", Does not match: "Text...\$value.key..." */
export const DEFAULT_REPLACE_REGEX_TRADITIONAL = '(?<!\\\\)\\$([a-zA-Z0-9\\.\\-_]*)';
//Keep: export const DEFAULT_REPLACE_REGEX_TRADITIONAL = '\\$([a-zA-Z0-9\\.\\-_]*)';

type TaskHandler<T> = (context: TaskContext, task: T) => Promise<void>;

const newTaskSchema = <T, Type extends TaskType>(type: Type, obj: T) => {
  return TaskBaseSchema.extend({
    type: z.literal(type),
    ...obj,
  });
};

export const GlobFilterSchema = z.union([z.string().nonempty(), z.array(z.string().nonempty())]).optional();
export const GlobFiltersSchema = z.object({
  include: GlobFilterSchema,
  exclude: GlobFilterSchema,
});

const newTaskSchemaWithGlobFilters = <T, Type extends TaskType>(type: Type, obj: T) => {
  return TaskBaseSchema.extend({
    type: z.literal(type),
    ...obj,
    include: GlobFilterSchema,
    exclude: GlobFilterSchema,
  });
};

export const convertToRuntimeTask = <T extends Task>(task: T): RuntimeTask<T> => {
  return {
    ...task,
    __compare__elements: [],
  };
};

/** NOTE: Future feature implementation */
const setHandler = <T extends ZodObject<ZodRawShape>, O extends z.infer<T>>(
  originSchema: T,
  handler: TaskHandler<O>
) => {
  const handlerSchema = z.custom<TaskHandler<O>>().default(handler);
  return originSchema.extend({
    handler: handlerSchema,
  });
};

export interface TaskContext {
  os: {
    platform: NodeJS.Platform;
    architecture: NodeJS.Architecture;
    machine: string;
  };

  originCwd: string;
  baseCwd: string;

  /** The regex to replace variable literal */
  varReplaceRegexList: RegExp[];
  /** The regex to replace environment variable literal */
  envVarReplaceRegexList: RegExp[];

  replaceProviders: { regex: RegExp; store: (varPath: string) => any }[];

  /** The system variables used by the tasks */
  systemVars: {
    __env: {
      cwd_startup: string;
      cwd_base: string;
    };
  };

  /** The shared object to store variable values */
  vars: {
    [key: string]: any;
  };

  opts: Options;
  program: Command;
}

export const TaskTypeSchema = z.union([
  z.literal('git-setup'),
  z.literal('cmd'),
  z.literal('set-var'),
  z.literal('output'),
  z.literal('symlink'),
  z.literal('fs-copy'),
  z.literal('fs-del'),
  z.literal('fs-mkdir'),
  z.literal('fs-touch'),
  z.literal('env-var'),
  z.literal('sub-tasks'),
  z.literal('content-replace'),
]);

export type TaskType = z.infer<typeof TaskTypeSchema>;

/** {@link NodeJS.Platform} */
const BasePlatforms = [
  'aix',
  'android',
  'darwin',
  'freebsd',
  'haiku',
  'linux',
  'openbsd',
  'sunos',
  'win32',
  'cygwin',
  'netbsd',
] as const;
const Platforms = [...BasePlatforms, ...BasePlatforms.map((item) => `!${item}`)] as const;
type Platform = (typeof Platforms)[number];

/** {@link NodeJS.Architecture} */
const BaseArchitectures = ['arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x64'] as const;
const Architectures = [...BaseArchitectures, ...BaseArchitectures.map((item) => `!${item}`)] as const;
type Architecture = (typeof Architectures)[number];

/** {@link NodeJS.Machine} */
const BaseMachines = [
  'arm',
  'arm64',
  'aarch64',
  'mips',
  'mips64',
  'ppc64',
  'ppc64le',
  's390',
  's390x',
  'i386',
  'i686',
  'x86_64',
] as const;
const Machines = [...BaseMachines, ...BaseMachines.map((item) => `!${item}`)] as const;
type Machine = (typeof Machines)[number];

os.machine();

export const TaskWhenSchema = z.object({
  platform: z.custom<Platform>().optional(),
  architecture: z.custom<Architecture>().optional(),
  machine: z.custom<Machine>().optional(),
});

export const TaskBaseSchema = z.object({
  type: TaskTypeSchema,
  id: z.string().trim().nonempty().optional(),
  tags: z
    .union([z.string().trim().nonempty(), z.array(z.string().trim().nonempty())])
    .optional()
    .transform((value) => {
      if (!value) return [];
      if (typeof value === 'string') return [value];
      return value;
    }),
  cwd: z.string().nonempty().optional(),
  enabled: z.boolean().default(true),
  when: TaskWhenSchema.optional(),
  comment: z.string().optional(),
  onError: z.union([z.literal('skip'), z.literal('throw'), z.literal('warn')]).default('throw'),
});

export type TaskBase = z.infer<typeof TaskBaseSchema>;
export type GlobFilters = z.infer<typeof GlobFiltersSchema>;

export const TaskGitSetupSchema = newTaskSchema('git-setup', {
  checkLocalChanges: z
    .boolean()
    .default(true)
    .describe('Whether to check for local changes, unpushed commits, and warn or throw'),
  remote: z.string().nonempty().default('origin'),
  localPath: z.string().nonempty(),
  /** Executable git binary */
  binary: z.string().nonempty().optional(),
  url: z.string().nonempty(),
  branch: z.string().nonempty(),
  startPoint: z.string().nonempty().optional().describe('The commit hash or tag to checkout'),
  updateSubmodules: z.union([z.array(z.string().nonempty()), z.boolean()]).default(true),
});
export type TaskGitSetup = z.infer<typeof TaskGitSetupSchema>;

export const TaskSymlinkSchema = newTaskSchema('symlink', {
  type: z.literal('symlink'),
  target: z.string().nonempty(),
  path: z.string().nonempty(),
  linkType: z.union([z.literal('dir'), z.literal('file'), z.literal('junction')]).optional(),
  forced: z.boolean().optional(),
});
export type TaskSymlink = z.infer<typeof TaskSymlinkSchema>;

export const TaskTerminalCommandSchema = newTaskSchema('cmd', { cmd: z.string(), shell: z.string().optional() });
export type TaskTerminalCommand = z.infer<typeof TaskTerminalCommandSchema>;

export const TaskSetVarSchema = newTaskSchemaWithGlobFilters('set-var', {
  key: z.string().nonempty(),
  value: z.union([z.string(), z.number(), z.boolean(), z.any()]),
  src: z.string().nonempty().optional(),
  parser: z.union([z.literal('json'), z.literal('lines'), z.literal('string'), z.literal('auto')]).default('auto'),
  /** If the variable already exists, assigning will be skipped */
  isFallback: z.boolean().default(false).describe('If the variable already exists, assigning will be skipped'),
});
export type TaskSetVar = z.infer<typeof TaskSetVarSchema>;

export const TaskEnvVarMapSchema = newTaskSchemaWithGlobFilters('env-var', {
  map: z.union([z.string(), z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))]).optional(),
  src: z.string().nonempty().optional(),
  parser: z.union([z.literal('json'), z.literal('lines'), z.literal('auto')]).default('auto'),
  /** If the environment variable already exists, assigning will be skipped */
  isFallback: z
    .boolean()
    .default(false)
    .describe('If the environment variable already exists, assigning will be skipped'),
});

export const TaskEnvVarKVSchema = newTaskSchema('env-var', {
  key: z.string().nonempty(),
  value: z.string(),
  /** If the environment variable already exists, assigning will be skipped */
  isFallback: z
    .boolean()
    .default(false)
    .describe('If the environment variable already exists, assigning will be skipped'),
}).transform((params) => {
  return TaskEnvVarMapSchema.parse({
    ...omit(params, ['key', 'value']),
    map: {
      [params.key]: params.value,
    },
  } satisfies z.input<typeof TaskEnvVarMapSchema>);
});

export const TaskEnvVarSchema = z.union([TaskEnvVarMapSchema, TaskEnvVarKVSchema]);

export type TaskEnvVar = z.infer<typeof TaskEnvVarSchema>;
export type TaskEnvVarIn = z.input<typeof TaskEnvVarSchema>;

export const TaskOutputTargetsSchema = z.union([
  z.literal('console').describe('Output to console'),
  z.literal('file-write').describe('Output to file (overwriting)'),
  z.literal('file-append').describe('Output to file (appending)'),
  z.literal('c').describe('Output to console'),
  z.literal('fw').describe('Output to file (overwriting)'),
  z.literal('fa').describe('Output to file (appending)'),
]);

export type TaskOutputTargets = z.infer<typeof TaskOutputTargetsSchema>;

export const TaskOutputSchema = newTaskSchema('output', {
  target: TaskOutputTargetsSchema,
  text: z.string(),
  path: z.string().nonempty().optional(),
});
export type TaskOutput = z.infer<typeof TaskOutputSchema>;

export const TaskFsCopyOptionsSchema = z.object({
  conflict: z
    .union([
      z.literal('overwrite'),
      z.literal('skip'),
      /**
       * @reserved - feature in future:
       * z.literal('prompt')*/
    ])
    .default('overwrite'),
});
export type TaskFsCopyOptions = z.infer<typeof TaskFsCopyOptionsSchema>;

export const TaskFsCopySchema = newTaskSchemaWithGlobFilters('fs-copy', {
  src: z.string().nonempty(),
  dest: z.string().nonempty(),
  options: TaskFsCopyOptionsSchema.default({ conflict: 'overwrite' }),
});
export type TaskFsCopy = z.infer<typeof TaskFsCopySchema>;

export const TaskFsDeleteSchema = newTaskSchemaWithGlobFilters('fs-del', {
  path: z.string().nonempty(),
});
export type TaskFsDelete = z.infer<typeof TaskFsDeleteSchema>;

export const TaskFsMakeDirSchema = newTaskSchema('fs-mkdir', {
  path: z.string().nonempty(),
});
export type TaskFsMakeDir = z.infer<typeof TaskFsMakeDirSchema>;

export const TaskFsTouchSchema = newTaskSchema('fs-touch', {
  path: z.string().nonempty(),
});
export type TaskFsTouch = z.infer<typeof TaskFsTouchSchema>;

/**
 * Configuration for running a set of tasks as a sub-task group.
 * FUTURE: Add glob support for task file patterns
 */
export const TaskSubTasksSchema = newTaskSchemaWithGlobFilters('sub-tasks', {
  /** The path to the task file or directory to run as a sub-task group.*/
  src: z.string().nonempty(),

  /** Configuration for inheriting context from parent task. */
  inherit: z
    .object({ args: z.boolean().default(true), vars: z.boolean().default(true) })
    .default({ args: true, vars: true })
    .describe('Whether to inherit args and vars from the parent task.'),

  /** Command-line arguments to pass to the sub-tasks. */
  args: z.string().optional(),
});
export type TaskSubTasks = z.infer<typeof TaskSubTasksSchema>;

export const RegexDataSchema = z.object({ pattern: z.string(), flags: z.string().optional() });
export const TaskContentFindSchema = z.union([z.string().nonempty(), RegexDataSchema]);
export type RegexData = z.infer<typeof RegexDataSchema>;

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

export const TaskSchema = z.union([
  TaskGitSetupSchema,
  TaskTerminalCommandSchema,
  TaskSetVarSchema,
  TaskEnvVarSchema,
  TaskOutputSchema,
  TaskFsCopySchema,
  TaskFsDeleteSchema,
  TaskFsMakeDirSchema,
  TaskSymlinkSchema,
  TaskSubTasksSchema,
  TaskContentReplaceSchema,
]);
export type Task = z.infer<typeof TaskSchema>;
export type RuntimeTask<T extends Task> = T & {
  __compare__elements: string[];
};
export type AnyRuntimeTask = RuntimeTask<Task>;

export type TaskInput = z.input<typeof TaskSchema>;

const ReplaceRegexSchema = z
  .string()
  .nonempty()
  .default(DEFAULT_REPLACE_REGEX)
  .describe('The regex to replace text with variable values')
  .refine((value) => value.indexOf('(') >= 0 && value.indexOf(')') >= 0, {
    message: `The Regex must contains regex group express '(' and ')'`,
  });

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

export const VAR_FROM_ARGUMENT_PREFIX = '--var-';
export const ENV_VAR_FROM_ARGUMENT_PREFIX = '--env-';
