import { LogLevel } from './build_cli_parser';

export interface TaskContext {
  originCwd: string;
  baseCwd: string;
  replaceRegex: RegExp;
  vars: any;
}

export const allTaskTypes = [
  'git-repo-prepare',
  'cmd',
  'set-var',
  'output',
  'symlink',
  'fs-copy',
  'fs-del',
  'fs-mkdir',
  'env-var',
  'sub-tasks',
  'content-replace',
] as const;
type TasksTuple = typeof allTaskTypes;
export type TaskType = TasksTuple[number];

export interface Task {
  type: TaskType;
  id?: string;
  tags?: string | string[];
  cwd?: string;
  enabled?: boolean;
  comment?: string;
  __compare__elements: string[];

  //TODO:Implement allowError
  /** The process will not be interrupted even if errors are caught from this task. */
  allowError?: boolean;
}

export interface TaskGitCheckout extends Task {
  /** Executable git binary */
  binary?: string;
  url?: string;
  localPath: string;
  branch?: string;
  startPoint?: string;
  updateSubmodules?: Array<string> | string | boolean;
}

export interface TaskSymlink extends Task {
  target: string;
  path: string;
  linkType?: 'dir' | 'file' | 'junction';
  forced?: boolean;
}

export interface TaskTerminalCommand extends Task {
  cmd: string;
  shell?: string;
}

export interface TaskSetVar extends Task, GlobFilters {
  key: string;
  value?: string | number | boolean | any;
  src?: string;
  parser?: 'json' | 'lines' | 'string' | 'auto';
  /** If the variable already exists, assigning will be skipped */
  isFallback?: boolean;
}

export interface TaskEnvVar extends Task, GlobFilters {
  value?: any;
  src?: string;
  parser?: 'json' | 'lines' | 'auto';
  /** If the environment variable already exists, assigning will be skipped */
  isFallback?: boolean;
}

export type TaskOutputTargets = 'console' | 'file-write' | 'file-append' | 'c' | 'fw' | 'fa';
export interface TaskOutput extends Task {
  text: string;
  target: TaskOutputTargets;
  path?: string;
}

export interface GlobFilters {
  include?: string | string[];
  exclude?: string | string[];
}

export type TaskFsCopyOptions = {
  conflict?: 'overwrite' | 'skip';
};

export interface TaskFsCopy extends Task, GlobFilters {
  src: string;
  dest: string;
  options?: TaskFsCopyOptions;
}

export interface TaskFsDelete extends Task, GlobFilters {
  path: string;
}

export interface TaskFsMakeDir extends Task {
  path: string;
}

export interface TaskSubTasks extends Task {
  args: string;
}

export interface RegexData {
  pattern: string;
  flags?: string;
}

export interface TaskContentReplace extends Task, GlobFilters {
  /**
   * If the task includes 'include' or 'exclude', it will be handled as a directory.
   * Otherwise, it will be processed as a file.
   */
  path: string;

  find: string | RegexData;
  replace: string;
  loop?: number;
}

export interface Config {
  name?: string;

  env?: {
    logLevel?: LogLevel;
    /** @deprecated */
    verbose?: boolean;
    /** @deprecated */
    verboseGit?: boolean;
    replaceRegex?: string;
  };
  tasks?: Array<Task>;
}

export const LOG_TAG = 'useful-tasks';
export const TAG_DEBUG = `${LOG_TAG}:debug`;
export const TAG_INFO = `${LOG_TAG}:info`;
export const TAG_WARN = `${LOG_TAG}:warn`;

/** e.g. ${value.key} */
export const DEFAULT_REPLACE_REGEX = '\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}';

export const VAR_FROM_ARGUMENT_PREFIX = '--var-';
export const ENV_VAR_FROM_ARGUMENT_PREFIX = '--env-';
