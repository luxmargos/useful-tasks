import { handleSubTasks } from './tasks/handleSubTasks';
import { handleContentReplace } from './tasks/handleContentReplace';
import { handleMkdir } from './tasks/handleFsMkdir';
import { handleFsDelete } from './tasks/handleFsDelete';
import { handleFsCopy } from './tasks/handleFsCopy';
import { handleOutput } from './tasks/handleOutput';
import { handleEnvVar } from './tasks/handleEnvVar';
import { handleSetVar } from './tasks/handleSetVar';
import { handleTerminalCommand } from './tasks/handleTerminalCommand';
import { handleFsSymlink } from './tasks/handleFsSymlink';
import { handleGitSetup } from './tasks/handleGitRepoSetup';
import { TaskContext, TaskType } from './task_data';

export const handlerMap: {
  [k in TaskType]: (context: TaskContext, task: any) => Promise<void>;
} = {
  'git-setup': handleGitSetup,
  cmd: handleTerminalCommand,
  'set-var': handleSetVar,
  output: handleOutput,
  symlink: handleFsSymlink,
  'fs-copy': handleFsCopy,
  'fs-del': handleFsDelete,
  'fs-mkdir': handleMkdir,
  'env-var': handleEnvVar,
  'sub-tasks': handleSubTasks,
  'content-replace': handleContentReplace,
};
