#!/usr/bin/env node

import path from 'path';
import { setup } from './build_cli_parser';
import { initUsefulTasks, usefulTasks } from './useful_tasks';

export { initUsefulTasks, usefulTasks };

const originCwd = path.resolve(process.cwd());
const setupResult = setup();
initUsefulTasks(originCwd, setupResult.opt, setupResult.program);
