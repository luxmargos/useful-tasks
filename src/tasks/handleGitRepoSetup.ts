import fs from 'fs';
import path from 'path';
import simpleGit, { CheckRepoActions, ResetMode } from 'simple-git';
import { TaskContext, TaskGitSetup } from 'task_data';

// TODO: Check has local changes and warn or throw
export const handleGitSetup = async (context: TaskContext, task: TaskGitSetup) => {
  const localPath = path.resolve(task.localPath);

  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }

  if (fs.readdirSync(localPath).length === 0) {
    if (task.url) {
      await simpleGit().clone(task.url, localPath);
    }
  }

  const git = simpleGit(localPath, { binary: task.binary });

  const isGitRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
  if (!isGitRepo) {
    throw Error(`${localPath} is not a git repository!!!`);
  }

  if (task.updateSubmodules) {
    await git.submoduleInit();
    await git.submoduleUpdate();
  } else {
    // const submodules = task.updateSubmodules ?? [];
    // for(var submod of submodules){
    // }
  }

  await git.fetch();

  if (task.branch) {
    let hasLocalBranch = false;
    const branchLocal = await git.branchLocal();
    for (var b of branchLocal.all) {
      if (b === task.branch) {
        hasLocalBranch = true;
        break;
      }
    }

    const branch = task.branch ?? '';
    const startPoint: string = task.startPoint ?? '';

    if (!hasLocalBranch) {
      await git.checkoutBranch(branch, startPoint);
    } else {
      if (branchLocal.current !== task.branch) {
        await git.checkout(branch);
      }
      await git.reset(ResetMode.HARD, [startPoint]);
    }
  }
};
