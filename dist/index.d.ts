#!/usr/bin/env node
import { Command } from 'commander';

declare const cwdModes: readonly ["restore", "keep"];
type CwdModeTuple = typeof cwdModes;
type CwdMode = CwdModeTuple[number];
interface Options {
    cwd?: string;
    config: string;
    include?: string[];
    includeCta?: string[];
    exclude?: string[];
    excludeCta?: string[];
    camelKeys: boolean;
    cwdMode?: CwdMode;
    cwdModeIsContinue?: boolean;
    extraArgs?: string[];
}

declare const usefulTasks: (originCwd: string, opt: Options, program: Command) => void;

export { usefulTasks };
