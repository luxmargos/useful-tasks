export interface Task {
    type:'git-checkout'|'symlink'|'cmd'
}

export interface TaskGitCheckout extends Task{
    /** Executable git binary */
    binary?:string,
    url?:string,
    localPath:string,
    branch?:string,
    startPoint?:string,
    updateSubmodules?:Array<string> | string | boolean
}

export interface TaskSymlink extends Task{
    target:string,
    path:string,
    linkType?:'dir' | 'file' | 'junction',
    forced?:boolean
}

export interface TaskTerminalCommand extends Task{
    cmd:string
}

export interface DepsJson {
    name?:string,
    verbose?:boolean,
    verboseGit?:boolean,
    tasks?:Array<TaskGitCheckout | TaskSymlink>
}

export const TAG = "dependency-resolver"