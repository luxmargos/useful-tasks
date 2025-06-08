import { Command } from 'commander';
import { Options, RequireOptions } from './build_cli_parser';
import { z, ZodObject, ZodRawShape } from 'zod';
import { RuntimeTask, Task } from './script';

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

export const newTaskSchema = <T, Type extends TaskType>(type: Type, obj: T) => {
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

export const newTaskSchemaWithGlobFilters = <T, Type extends TaskType>(type: Type, obj: T) => {
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

  opts: RequireOptions;
  program: Command;
}

export const TaskTypeSchema = z.union([
  z.literal('git-setup'),
  z.literal('cmd'),
  z.literal('set-var'),
  z.literal('output'),
  z.literal('fs-symlink'),
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

export const RegexDataSchema = z.object({ pattern: z.string(), flags: z.string().optional() });
export type RegexData = z.infer<typeof RegexDataSchema>;

export const ReplaceRegexSchema = z
  .string()
  .nonempty()
  .default(DEFAULT_REPLACE_REGEX)
  .describe('The regex to replace text with variable values')
  .refine((value) => value.indexOf('(') >= 0 && value.indexOf(')') >= 0, {
    message: `The Regex must contains regex group express '(' and ')'`,
  });

export const VAR_FROM_ARGUMENT_PREFIX = '--var-';
export const ENV_VAR_FROM_ARGUMENT_PREFIX = '--env-';
