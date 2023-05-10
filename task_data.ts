export interface TaskContext {
    valueReplaceReg:RegExp;
    values:any;
}

export interface Task {
    type:'git-repo-prepare'|'symlink'|'cmd'|'set-value'|'echo';
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
