export interface TaskContext {
    valueReplaceReg:RegExp;
    values:any;
}

export interface Task {
    type:'git-repo-prepare'|'symlink'|'cmd'|'set-value'|'output'|'fs-copy'|'fs-del';
    id?:string;
    tags?:string | string[],
    cwd?:string;
    enabled?:boolean;
    comment?:string;
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


export interface TaskSetValue extends Task{
    key:string;
    value:string|number|any|boolean;
    valueType:'value'|'file';
    fileFormat:'json'|'string';
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
}

export interface TaskFsDelete extends Task{
    path:string;
}

export interface Config {
    name?:string;
    
    env?:{
        verbose?:boolean;
        verboseGit?:boolean;
        valueReplaceRegex?:string;
    };
    tasks?:Array<Task>;
}

export const TAG = "useful-tasks"

/** e.g. ${value.key} */
export const DEFAULT_VALUE_REPLACE_REGEX = "\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}";

export const VALUE_FROM_ARGUMENT_PREFIX = "--val-";