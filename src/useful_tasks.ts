import path from 'path';
import { CWD_KEEP, LogLevel, Options, logLevels } from './build_cli_parser';
import { containsAllTag, containsTag, loadJsonConfig } from './utils';
import debug from 'debug';
import os from 'os';
import {
  TasksConfig,
  TAG_DEBUG,
  Task,
  TaskContext,
  VAR_FROM_ARGUMENT_PREFIX,
  ENV_VAR_FROM_ARGUMENT_PREFIX,
  TAG_INFO,
  TAG_WARN,
  TasksConfigInput,
  TasksConfigSchema,
  convertToRuntimeTask,
  RuntimeTask,
  AnyRuntimeTask,
} from './task_data';
import { replaceVarLiterals, searchExtraKeyValue, setTaskVar, setEnvVar } from './task_utils';
import { Command } from 'commander';
import { handlerMap } from './handler_map';
import { logi, logv, logw } from './loggers';
import { isNil, isNotNil } from 'es-toolkit';

export const usefulTasks = async (
  originCwd: string,
  opts: Options,
  tasksConfigInput: TasksConfigInput,
  program: Command
) => {
  const tasksConfig: TasksConfig = TasksConfigSchema.parse(tasksConfigInput);

  // cli argument can overwrite json's cwdMode
  const cwdModeIsKeep = opts.cwdMode ? opts.cwdMode === CWD_KEEP : tasksConfig.env.cwdMode === CWD_KEEP;

  let debugPat: string | undefined;
  let logLevel: LogLevel = tasksConfig.env.logLevel;

  const varReplaceRegex = tasksConfig.env.varReplaceRegex;
  const envReplaceRegex = tasksConfig.env.envReplaceRegex;

  //cli argument can overwrite json's logLeve
  if (opts.logLevel && logLevels.includes(opts.logLevel)) {
    logLevel = opts.logLevel;
  }

  if (logLevel === 'debug') {
    // debugPat = `${LOG_TAG}:*`;
    debugPat = `${TAG_WARN},${TAG_INFO},${TAG_DEBUG}`;
    debugPat = `${debugPat},simple-git,simple-git:*`;
  } else if (logLevel === 'info') {
    debugPat = `${TAG_WARN},${TAG_INFO}`;
  }

  if (debugPat) {
    debug.enable(debugPat);
  }

  logv(`CLI Options`, opts);

  const baseCwd = path.resolve(process.cwd());

  const context: TaskContext = {
    os: {
      platform: process.platform,
      architecture: process.arch,
      machine: os.machine(),
    },

    originCwd,
    baseCwd,
    varReplaceRegex: new RegExp(varReplaceRegex),
    envVarReplaceRegex: new RegExp(envReplaceRegex),
    systemVars: {
      __env: {
        cwd_startup: originCwd,
        cwd_base: baseCwd,
      },
    },
    vars: {},
    opts,
    program,
  };

  if (opts.extraArgs) {
    logv('Setting up the variables from the additional arguments');
    searchExtraKeyValue(opts.extraArgs, VAR_FROM_ARGUMENT_PREFIX, opts.camelKeys, (key: string, value: string) => {
      setTaskVar(context, key, value, false);
    });

    logv('Setting up the environment variables from the additional arguments');
    searchExtraKeyValue(opts.extraArgs, ENV_VAR_FROM_ARGUMENT_PREFIX, opts.camelKeys, (key: string, value: string) => {
      setEnvVar(context, key, value, false);
    });
  }

  logi('');
  logi(`[${tasksConfig.name}] Start task processing`);

  const getTaskRepresentStr = (task: Task, i?: number) => {
    if (i !== undefined && i !== null) {
      return task.id !== undefined ? `[${i}]${task.id}/${task.type}` : `[${i}]${task.type}`;
    } else {
      return task.id !== undefined ? `${task.id}/${task.type}` : `${task.type}`;
    }
  };

  const runTasks = async () => {
    let tasks: AnyRuntimeTask[] = (tasksConfig.tasks ?? []).map(convertToRuntimeTask);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      // Validate task IDs
      if (isNotNil(task.id)) {
        for (let j = i + 1; j < tasks.length; j++) {
          const otherTask = tasks[j];
          if (otherTask.id !== undefined && otherTask.id === task.id) {
            throw new Error(`The task id '${task.id}' must be unique`);
          }
        }
      }

      if (!task.type || !(task.type in handlerMap)) {
        throw new Error(`Found the invalid task type '${task.type}'`);
      }

      if (task.id) task.__compare__elements.push(task.id);
      if (task.tags) task.__compare__elements.push(...task.tags);
    }

    if (opts.exclude && opts.exclude.length > 0) {
      const excludeItems = opts.exclude;

      logv(`Excluding tasks by specified IDs or Tags : --exclude=${excludeItems}`);
      tasks = tasks.filter((taskItem: AnyRuntimeTask) => {
        if (containsTag(excludeItems, taskItem.__compare__elements) === false) {
          return taskItem;
        }
      });
    }

    tasks = tasks.filter((taskItem: AnyRuntimeTask) => {
      if (isNil(taskItem.when)) return true;

      const { platform, architecture, machine } = taskItem.when;
      if (isNotNil(platform)) {
        if (platform.startsWith('!')) {
          if (platform.substring(1) === context.os.platform) {
            return false;
          }
        } else {
          if (platform !== context.os.platform) {
            return false;
          }
        }
      }
      if (isNotNil(architecture)) {
        if (architecture.startsWith('!')) {
          if (architecture.substring(1) === context.os.architecture) {
            return false;
          }
        } else {
          if (architecture !== context.os.architecture) {
            return false;
          }
        }
      }
      if (isNotNil(machine)) {
        if (machine.startsWith('!')) {
          if (machine.substring(1) === context.os.machine) {
            return false;
          }
        } else {
          if (machine !== context.os.machine) {
            return false;
          }
        }
      }
      return true;
    });

    if (opts.excludeCta && opts.excludeCta.length > 0) {
      const excludesItems = opts.excludeCta;
      logv(`Excluding tasks by specified IDs or Tags : --exclude-cta=${excludesItems}`);
      tasks = tasks.filter((taskItem: AnyRuntimeTask) => {
        if (containsAllTag(excludesItems, taskItem.__compare__elements) === false) {
          return taskItem;
        }
      });
    }
    const hasIncludeFilters = opts.include && opts.include.length > 0;
    const hasIncludeCTAFilters = opts.includeCta && opts.includeCta.length > 0;
    if (hasIncludeFilters || hasIncludeCTAFilters) {
      const includeItems = opts.include;
      const includeCtaItems = opts.includeCta;

      logv(`Including tasks by specified IDs or Tags : --include=${includeItems} / --include-cta=${includeCtaItems}`);
      tasks = tasks.filter((taskItem: AnyRuntimeTask) => {
        if (
          (hasIncludeFilters && containsTag(includeItems!, taskItem.__compare__elements) === true) ||
          (hasIncludeCTAFilters && containsAllTag(includeCtaItems!, taskItem.__compare__elements) === true)
        ) {
          return taskItem;
        }
      });
    }

    logi(
      `Tasks : ${tasks.map((v, i) => {
        return getTaskRepresentStr(v, i);
      })}`
    );

    const taskCount = tasks.length ?? 0;
    for (let i = 0; i < taskCount; i++) {
      const task = tasks[i];
      await replaceVarLiterals(context, task);

      const taskRepresentStr = getTaskRepresentStr(task, i);
      if (task.enabled === false) {
        logi(`\n### Skip the task without execution => ${taskRepresentStr}`);
        continue;
      } else {
        logi(`\n### Task : ${taskRepresentStr}`);
      }

      if (task.comment) {
        logi(task.comment);
      }

      let cwdHasChanges = false;
      if (task.cwd) {
        const taskCwd = path.resolve(task.cwd);
        logi(`Changing the current working directory => ${taskCwd}`);
        cwdHasChanges = true;
        process.chdir(taskCwd);
      }

      const taskHandler = handlerMap[task.type];
      try {
        await taskHandler(context, task);
      } catch (e) {
        if (task.onError === 'skip') {
          logv(`Skip the failed task => ${taskRepresentStr}`, e);
        } else if (task.onError === 'warn') {
          logw(`Warn about the failed task => ${taskRepresentStr}`, e);
        } else {
          throw e;
        }
      }

      if (!cwdModeIsKeep) {
        if (cwdHasChanges) {
          logi(`Restoring the current working directory => ${baseCwd}`);
        }
        process.chdir(baseCwd);
      }
    }
  };

  let hasError = false;
  let error: unknown;
  try {
    await runTasks();
  } catch (e) {
    hasError = true;
    error = e;
  }

  if (hasError) {
    throw error;
  } else {
    process.chdir(baseCwd);
    logi(`[${tasksConfig.name}] Tasks done\n`);
  }
};

export const initUsefulTasks = (originCwd: string, opts: Options, program: Command) => {
  let tasksConfigInput: TasksConfigInput = {};

  let configFilePath = path.resolve(opts.config);
  try {
    tasksConfigInput = loadJsonConfig(configFilePath);
  } catch (e: any) {
    if (e instanceof Error) {
      console.log(e.message);
    } else {
      console.log(e);
    }
    console.log('');
    program.help();
  }

  return usefulTasks(originCwd, opts, tasksConfigInput, program);
};
