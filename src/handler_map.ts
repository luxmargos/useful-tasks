import { handleSubTasks } from "./handler_sub_tasks";
import { handleContentReplace, handleEnvVar, handleFsCopy, handleFsDelete, handleGitRepoSetup, handleOutput, handleSetVar, handleSymlink, handleTerminalCommand } from "./handlers";
import { TaskContext, TaskType } from "./task_data";

export const handlerMap:{
    [k in TaskType]:(context:TaskContext, task:any)=>Promise<void>
} = {
    "git-repo-prepare": handleGitRepoSetup,
    symlink: handleSymlink,
    cmd: handleTerminalCommand,
    "set-var": handleSetVar,
    output: handleOutput,
    "fs-copy":handleFsCopy,
    "fs-del":handleFsDelete,
    "env-var":handleEnvVar,
    "sub-tasks": handleSubTasks,
    "content-replace":handleContentReplace
};