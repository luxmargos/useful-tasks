export type TaskContext = {values:any};

export interface Task {
    type:'git-repo-prepare'|'symlink'|'cmd'|'set-value';
    id?:string;
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

export interface TaskEcho extends Task{
    text:string;
}

export interface DepsJson {
    name?:string;
    verbose?:boolean;
    verboseGit?:boolean;
    tasks?:Array<Task>;
}

export const TAG = "useful-tasks"

/** e.g. ${value.key} */
export const REGEX_REPLACE_VALUE = new RegExp("\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}");
