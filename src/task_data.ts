import fse from 'fs-extra';


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
    var:string|number|any|boolean;
    varType:'value'|'file';
    fileFormat:'json'|'string';
}

export interface TaskEnvVar extends Task{
    var:any;
    varType:'dict'|'file';
}

export type TaskOutputTargets = 'console'|'file-write'|'file-append'|'c'|'fw'|'fa';
export interface TaskOutput extends Task{
    text:string;
    target:TaskOutputTargets;
    path?:string;
}

export interface TaskFsCopy extends Task{
    src:string;
    dest:string;
    options?:{
        conflict:'overwrite'|'skip'
    };
}

export interface TaskFsDelete extends Task{
    path:string;
}

export interface TaskSubTasks extends Task{
    args:string;
}

export interface Config {
    name?:string;
    
    env?:{
        verbose?:boolean;
        verboseGit?:boolean;
        replaceRegex?:string;
    };
    tasks?:Array<Task>;
}

export const TAG = "useful-tasks"

/** e.g. ${value.key} */
export const DEFAULT_REPLACE_REGEX = "\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}";

export const VAR_FROM_ARGUMENT_PREFIX = "--var-";
export const ENV_VAR_FROM_ARGUMENT_PREFIX = "--env-";