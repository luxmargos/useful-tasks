import path from 'path';
import { Options, setup } from './build_cli_parser';
import { Command } from 'commander';
import { usefulTasks } from './useful_tasks';
export { usefulTasks } from './useful_tasks';

const originCwd = path.resolve(process.cwd());

const setupResult = setup();

const opt:Options = setupResult.typedOptions;
const program:Command = setupResult.program;

usefulTasks(originCwd, opt, program);