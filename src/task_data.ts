import { LogLevel } from './build_cli_parser';

export interface TaskContext {
    originCwd:string;
    baseCwd:string;
    replaceRegex:RegExp;
    vars:any;
}

export const allTaskTypes = ['git-repo-prepare','symlink','cmd','set-var','output','fs-copy','fs-del','env-var','sub-tasks'] as const;
type TasksTuple = typeof allTaskTypes;
export type TaskType = TasksTuple[number];

export interface Task {
    type:TaskType;
    id?:string;
    tags?:string | string[],
    cwd?:string;
    enabled?:boolean;
    comment?:string;
    __compare__elements:string[];
}

export interface TaskGitCheckout extends Task{
    /** Executable git binary */
    binary?:string;
    url?:string;
    localPath:string;
    branch?:string;
    startPoint?:string;
    updateSubmodules?:Array<string> | string | boolean;
}

export interface TaskSymlink extends Task{
    target:string;
    path:string;
    linkType?:'dir' | 'file' | 'junction';
    forced?:boolean;
}

export interface TaskTerminalCommand extends Task{
    cmd:string;
    shell?:string;
}

export interface TaskSetVar extends Task{
    key:string;
    value:string|number|any|boolean;
    varType:'value'|'file';
    fileFormat:'json'|'string';
    isFallback?:boolean;

    /** @deprecated */
    var?:string|number|any|boolean;
}

export interface TaskEnvVar extends Task{
    value:any;
    varType:'dict'|'file';
    isFallback?:boolean;
    /** @deprecated */
    var?:any;
}

export type TaskOutputTargets = 'console'|'file-write'|'file-append'|'c'|'fw'|'fa';
export interface TaskOutput extends Task{
    text:string;
    target:TaskOutputTargets;
    path?:string;
}

export type RegexFriendly = string | string[] | RegexData | RegexData[] | any[];
export interface TaskFsCopy extends Task{
    src:string;
    dest:string;
    options?:{
        conflict?:'overwrite'|'skip';
    };
    
    include?:string | string[];
    exclude?:string | string[];
}

export interface TaskFsDelete extends Task{
    path:string;

    include?:string | string[];
    exclude?:string | string[];
}

export interface TaskSubTasks extends Task{
    args:string;
}

/**
 * TODO: implements
 */
export interface RegexData {
    pattern:string;
    flags?:string;
}

/**
 * TODO: implements
 */
export interface TaskRegexReplace extends Task {
    files:string | string[];
    from:string | RegexData[] | RegexData;
    to:string | string[];
}

export interface Config {
    name?:string;
    
    env?:{
        logLevel?:LogLevel;
        /** @deprecated */
        verbose?:boolean;
        /** @deprecated */
        verboseGit?:boolean;
        replaceRegex?:string;
    };
    tasks?:Array<Task>;
}

export const LOG_TAG = "useful-tasks";
export const TAG_DEBUG = `${LOG_TAG}:debug`;
export const TAG_INFO = `${LOG_TAG}:info`;

/** e.g. ${value.key} */
export const DEFAULT_REPLACE_REGEX = "\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}";

export const VAR_FROM_ARGUMENT_PREFIX = "--var-";
export const ENV_VAR_FROM_ARGUMENT_PREFIX = "--env-";