export interface Task {
    type:'git-repo-prepare'|'symlink'|'cmd',
    cwd?:string
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
    cmd:string,
    shell?:string,
}

export interface DepsJson {
    name?:string,
    verbose?:boolean,
    verboseGit?:boolean,
    tasks?:Array<Task>
}

export const TAG = "useful-tasks"