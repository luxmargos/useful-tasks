#!/usr/bin/env node

import path from 'path';
import { prepare } from './build_cli_parser';
import { initUsefulTasks, usefulTasks } from './useful_tasks';

export { initUsefulTasks, usefulTasks };

const originCwd = path.resolve(process.cwd());
const setupResult = prepare();
initUsefulTasks(originCwd, setupResult.opt, setupResult.program);
