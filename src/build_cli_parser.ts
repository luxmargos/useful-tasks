import { Command } from 'commander';
import path from 'path';
import * as packageJson from '../package.json';
import { isNil, isNotNil } from 'es-toolkit';
import { LogLevel, logLevels, logw } from './loggers';

export const DEFAULT_SCRIPT_FILE_NAME = 'useful_tasks.json';
export const DEFAULT_USE_CAMEL = true;

export const CWD_RESTORE = 'restore';
export const CWD_KEEP = 'keep';

export const CWD_MODES = [CWD_RESTORE, CWD_KEEP] as const;
type CwdModeTuple = typeof CWD_MODES;
export type CwdMode = CwdModeTuple[number];

export interface Options {
  cwd?: string;
  script: string;
  config?: string;
  include?: string[];
  includeAll?: string[];
  exclude?: string[];
  excludeAll?: string[];
  camelKeys: boolean;
  cwdMode?: CwdMode;
  logLevel?: LogLevel;
  extraArgs?: string[];
  extraMessages?: string[];
}

const argDesc = {
  cwdMode: `Choose working directory behavior:
  - '${CWD_RESTORE}': Reset CWD after each task
  - '${CWD_KEEP}': Keep last used CWD
  Example: --cwd-mode=keep`,
};

export const createProgram = () => {
  const program = new Command();
  program
    .name('useful-tasks')
    .version(packageJson.version)
    .option('--cwd <path>', 'Set working directory (e.g., --cwd=./projects)')
    .option(
      '-s, --script <path>',
      `Path of script file (default: ${DEFAULT_SCRIPT_FILE_NAME})`,
      DEFAULT_SCRIPT_FILE_NAME
    )
    .option(
      '-c, --config <path>',
      `A deprecated option, use -s, --script instead. Path of script file (default: ${DEFAULT_SCRIPT_FILE_NAME})`
    )
    .option(
      '-i, --include <tags>',
      'Include tasks with ANY matching tags/IDs\n' + 'Example: --include=tag1,tag2 matches tasks with tag1 OR tag2',
      (val) => val.split(',').map((s) => s.trim())
    )
    .option(
      '-a, --include-all <tags>',
      'Only include tasks with ALL specified tags/IDs\n' +
        'Example: --include-all=tag1,tag2 matches tasks with BOTH tag1 AND tag2',
      (val) => val.split(',').map((s) => s.trim())
    )
    .option(
      '-e, --exclude <tags>',
      'Exclude tasks with ANY matching tags/IDs\n' + 'Example: --exclude=tag1,tag2 excludes tasks with tag1 OR tag2',
      (val) => val.split(',').map((s) => s.trim())
    )
    .option(
      '-x, --exclude-all <tags>',
      'Exclude tasks with ALL specified tags/IDs\n' +
        'Example: --exclude-all=tag1,tag2 excludes tasks with BOTH tag1 AND tag2',
      (val) => val.split(',').map((s) => s.trim())
    )
    .option(
      '--camel-keys',
      'Convert variable keys to camelCase\n' + 'Example: --var-my-key becomes "myKey" when true',
      DEFAULT_USE_CAMEL
    )
    .option('--cwd-mode <mode>', argDesc.cwdMode, CWD_RESTORE)
    .option(
      '--log-level <level>',
      `Set logging level (${logLevels.join('|')})\n` + 'Example: --log-level=debug for verbose output'
    )
    .allowUnknownOption(true);

  return program;
};
/**
 * Initialize the command line parser and parse the arguments.
 * @param userArgv - The command line arguments to parse. If not provided, it will use the current process arguments.
 * @returns
 */
export const prepare = (userArgv?: string[], subTaskMode?: boolean) => {
  // console.log('cwd', process.cwd());
  // console.log('argv', process.argv);

  const program = createProgram();

  if (userArgv !== undefined) {
    program.parse(userArgv, { from: 'user' });
  } else {
    program.parse();
  }

  const opts = program.opts();
  // console.log(opts);

  const typedOptions = opts as Options;

  typedOptions.include = fixStringArrayArgument(typedOptions.include, subTaskMode ? undefined : []);
  typedOptions.includeAll = fixStringArrayArgument(typedOptions.includeAll, subTaskMode ? undefined : []);
  typedOptions.exclude = fixStringArrayArgument(typedOptions.exclude, subTaskMode ? undefined : []);
  typedOptions.excludeAll = fixStringArrayArgument(typedOptions.excludeAll, subTaskMode ? undefined : []);

  if (typedOptions.camelKeys !== undefined && typeof typedOptions.camelKeys === 'string') {
    let v: string = typedOptions.camelKeys;
    v = v.trim().toLowerCase();
    if (v === 'false' || v === '0' || v === 'no') {
      typedOptions.camelKeys = false;
    } else if (v === 'true' || v === '1' || v === 'yes') {
      typedOptions.camelKeys = true;
    } else {
      typedOptions.camelKeys = DEFAULT_USE_CAMEL;
    }
  }
  typedOptions.extraArgs = [...(program.args ?? [])];

  // console.log(`Using options : ${JSON.stringify(typedOptions, undefined, 2)}`);
  // console.log(`Extra arguments`, program.args);

  if (typedOptions.cwd) {
    process.chdir(path.resolve(typedOptions.cwd));
  }

  if (typedOptions.config) {
    typedOptions.script = typedOptions.config;
    typedOptions.config = undefined;
    typedOptions.extraMessages = ['You are using deprecated option --config, use -s, --script instead'];
  }

  // console.log("######################################################################")

  return { opt: typedOptions, program };
};

const fixStringArrayArgument = (
  value: string | string[] | undefined,
  defaultValue: string[] | undefined = [],
  skipEmptyItem: boolean = true
) => {
  if (isNil(value)) return defaultValue;

  if (typeof value === 'string') {
    const result: string[] = [];
    const arr = value.split(',');
    arr.forEach((value) => {
      const trimedValue = value.trim();
      if (skipEmptyItem) {
        if (trimedValue.length > 0) {
          result.push(trimedValue);
        }
      } else {
        result.push(trimedValue);
      }
    });
    return result;
  } else if (Array.isArray(value)) {
    return value;
  }

  return defaultValue;
};
