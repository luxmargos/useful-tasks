#!/usr/bin/env node
import { Command } from 'commander';

interface Options {
    cwd?: string;
    config: string;
    include?: string[];
    includeCta?: string[];
    exclude?: string[];
    excludeCta?: string[];
    camelKeys: boolean;
    extraArgs?: string[];
}

declare const usefulTasks: (originCwd: string, opt: Options, program: Command) => void;

export { usefulTasks };
