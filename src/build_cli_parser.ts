import { Command } from 'commander';
import path from 'path';
import * as packageJson from '../package.json';

export const DEFAULT_CONFIG = 'useful_tasks.json';
export const DEFAULT_USE_CAMEL = true;

export const CWD_RESTORE = 'restore';
export const CWD_KEEP = 'keep';

export const CWD_MODES = [CWD_RESTORE, CWD_KEEP] as const;
type CwdModeTuple = typeof CWD_MODES;
export type CwdMode = CwdModeTuple[number];

const LogLevelInfo = 'info';
const LogLevelDebug = 'debug';
const LogLevelNone = 'none';
export const logLevels = [LogLevelNone, LogLevelInfo, LogLevelDebug] as const;
type LogLevelTuple = typeof logLevels;
export type LogLevel = LogLevelTuple[number];

export interface Options {
  cwd?: string;
  config: string;
  include?: string[];
  includeCta?: string[];
  exclude?: string[];
  excludeCta?: string[];
  camelKeys: boolean;
  cwdMode?: CwdMode;
  logLevel?: LogLevel;
  extraArgs?: string[];
}

const argDesc = {
  cwdMode: `Choose between ${CWD_MODES.map((v) => `'${v}'`).join(
    ' or '
  )}. If you use 'cwd' property in a specific task, consider using this parameter. This parameter determines the behavior of the current working directory (CWD) when each task ends. In '${CWD_RESTORE}' mode, the CWD will be restored to its original state (or the one specified at --cwd) when each task ends, while in '${CWD_KEEP}' mode, the CWD will remain unchanged.`,
};

/**
 * Initialize the command line parser and parse the arguments.
 * @param userArgv - The command line arguments to parse. If not provided, it will use the current process arguments.
 * @returns
 */
export const setup = (userArgv?: string[]) => {
  // console.log('cwd', process.cwd());
  // console.log('argv', process.argv);

  const program = new Command();
  program
    .name('useful-tasks')
    .version(packageJson.version)
    .option('--cwd <string>', 'Change working directory')
    .option('-c, --config <string>', 'A path of json configuraion', DEFAULT_CONFIG)
    .option(
      '-i, --include <items>',
      'Include tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02'
    )
    .option(
      '-a, --include-cta <items>',
      'Include tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02'
    )
    .option(
      '-e, --exclude <items>',
      'Exclude tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02'
    )
    .option(
      '-x, --exclude-cta <items>',
      'Exclude tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02'
    )
    .option(
      '--camel-keys <boolean>',
      'Specify whether to use camel case for the key of the variable. If the value is true, the paramter "--var-my-key" will be converted to "myKey" otherwise it will be "my-key"',
      DEFAULT_USE_CAMEL
    )
    .option('--cwd-mode <string>', argDesc.cwdMode)
    .option(
      '--log-level <string>',
      `Specify the logging level as ${logLevels.join(
        ','
      )}. This parameter takes higher priority than the 'json' configuration.`
    )
    // Allow unknown option to allow syntax such as "--var-my-key" to be passed to the program
    .allowUnknownOption(true);

  if (userArgv !== undefined) {
    program.parse(userArgv, { from: 'user' });
  } else {
    program.parse();
  }

  const opts = program.opts();
  // console.log(opts);

  const typedOptions = opts as Options;
  typedOptions.include = fixStringArrayArgument(typedOptions.include);
  typedOptions.includeCta = fixStringArrayArgument(typedOptions.includeCta);
  typedOptions.exclude = fixStringArrayArgument(typedOptions.exclude);
  typedOptions.excludeCta = fixStringArrayArgument(typedOptions.excludeCta);

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

  // console.log("######################################################################")

  return { opt: typedOptions, program };
};

const fixStringArrayArgument = (value: string | string[] | undefined, skipEmptyItem: boolean = true) => {
  if (!value) {
    return [];
  }

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
  }

  return [];
};
