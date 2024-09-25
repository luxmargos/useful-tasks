#!/usr/bin/env node

import path from "path";
import { setup } from "./build_cli_parser";
import { usefulTasks } from "./useful_tasks";
export { usefulTasks } from "./useful_tasks";

const originCwd = path.resolve(process.cwd());
const setupResult = setup();
usefulTasks(originCwd, setupResult.opt, setupResult.program);
