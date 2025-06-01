import { logw } from '@/loggers';
import { isNotNil } from 'es-toolkit';
import fs from 'fs';
import path from 'path';
import simpleGit, { CheckRepoActions, ResetMode } from 'simple-git';
import { TaskContext, TaskGitSetup } from 'task_data';

// TODO: Check has local changes and warn or throw
export const handleGitSetup = async (context: TaskContext, task: TaskGitSetup) => {
  const remote = task.remote;
  const localPath = path.resolve(task.localPath);

  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }

  if (fs.readdirSync(localPath).length === 0) {
    await simpleGit().clone(task.url, localPath, { '--origin': remote });
  }

  const git = simpleGit(localPath, { binary: task.binary });

  const isGitRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
  if (!isGitRepo) {
    throw Error(`${localPath} is not a git repository!!!`);
  }

  if (typeof task.updateSubmodules === 'boolean') {
    if (task.updateSubmodules) {
      try {
        await git.submoduleInit();
      } catch (e) {}
      await git.submoduleUpdate();
    }
  } else {
    const submodules = task.updateSubmodules ?? [];
    for (const submod of submodules) {
      try {
        await git.submoduleInit(submod);
      } catch (e) {}
      await git.submoduleUpdate(submod);
    }
  }

  // Step 2: Check if the branch exists on remote
  const remoteBranch = await git.raw(['ls-remote', '--heads', remote, task.branch]);
  if (!remoteBranch || remoteBranch.length === 0) {
    throw Error(
      `The branch '${task.branch}' does not exist on remote '${remote}'. This branch appears to be local-only. Exiting.`
    );
  }

  // Step 3: Check for uncommitted or unpushed changes

  // Check for uncommitted, staged, or untracked (addable) files
  if (!git.diff(['--quiet']) || !git.diff(['--cached', '--quiet'])) {
    throw Error(
      'You have uncommitted or staged changes! Please commit, stash, or discard them before running this script.'
    );
  }

  const addableFiles = await git.raw(['ls-files', '--others', '--exclude-standard']);
  if (addableFiles.length > 0) {
    throw Error(
      `You have new files that are not staged (and not ignored by .gitignore):\n${addableFiles}\nPlease add, ignore, or remove these files before running this script.`
    );
  }

  await git.fetch(remote, task.branch);

  const localHash = await git.revparse(task.branch);
  const remoteHash = await git.revparse(`${remote}/${task.branch}`);

  if (!localHash || !remoteHash) {
    logw(
      `Warning: Cannot determine local or remote hash for '${task.branch}'/'${remote}/${task.branch}'. Skipping unpushed commit check.`
    );
  } else {
    if (localHash !== remoteHash) {
      const ahead = await git.raw(['rev-list', '--left-right', '--count', `${task.branch}...${remote}/${task.branch}`]);
      if (isNotNil(ahead) && ahead.length > 0 && Number(ahead) > 0) {
        throw Error(
          `You have local commits that are not pushed to ${remote}/${task.branch}. Please push them before running this script.`
        );
      }
    }
  }

  let hasLocalBranch = false;
  const branchLocal = await git.branchLocal();
  for (var b of branchLocal.all) {
    if (b === task.branch) {
      hasLocalBranch = true;
      break;
    }
  }

  const startPoint: string = task.startPoint ?? '';

  if (!hasLocalBranch) {
    await git.checkoutBranch(task.branch, startPoint);
  } else {
    if (branchLocal.current !== task.branch) {
      await git.checkout(task.branch);
    }
    await git.reset(ResetMode.HARD, [startPoint]);
  }
};
