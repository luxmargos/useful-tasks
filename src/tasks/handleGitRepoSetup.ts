import { logv, logw } from '@/loggers';
import { isFile, isNotNil } from 'es-toolkit';
import { isEmpty } from 'es-toolkit/compat';
import fs from 'fs';
import path from 'path';
import simpleGit, { CheckRepoActions, ResetMode, SimpleGit } from 'simple-git';
import { TaskContext, TaskGitSetup } from 'task_data';

/**
 * Handles the setup of a git repository.
 *
 * @description
 * 
 * This function clones the repository if it doesn't exist, adds the remote if it doesn't exist,
 * updates submodules if specified, checks for local changes, and resets the repository to the specified branch.
 *
 * @param context - The task context.
 * @param task - The task to handle.
 */
export const handleGitSetup = async (context: TaskContext, task: TaskGitSetup) => {
  const remote = task.remote;
  const localPath = path.resolve(task.localPath);

  const parentDir = path.dirname(localPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if (!fs.existsSync(localPath) || fs.readdirSync(localPath).length === 0) {
    await simpleGit().clone(task.url, localPath, { '--origin': remote });
  }

  const git = simpleGit(localPath, { binary: task.binary });

  const isGitRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
  if (!isGitRepo) {
    throw Error(`${localPath} is not a git repository!!!`);
  }

  const remotes = await git.getRemotes(true);
  if (!remotes.find((r) => r.name === remote)) {
    await git.addRemote(remote, task.url);
  }

  if (typeof task.updateSubmodules === 'boolean') {
    if (task.updateSubmodules) {
      await git.submoduleInit();
      await git.submoduleUpdate();
    }
  } else {
    const submodules = task.updateSubmodules ?? [];
    for (const submod of submodules) {
      await git.submoduleInit(submod);
      await git.submoduleUpdate(submod);
    }
  }

  // Check if the branch exists on remote
  const remoteBranch = await git.raw(['ls-remote', '--heads', remote, task.branch]);
  if (!remoteBranch || remoteBranch.length === 0) {
    throw Error(
      `The branch '${task.branch}' does not exist on remote '${remote}'. This branch appears to be local-only. Exiting.`
    );
  }

  if (task.checkLocalChanges) {
    // Check for uncommitted, staged, or untracked (addable) files
    // const diffQuiet = await git.diff(['--quiet']);
    // const diffCachedQuiet = await git.diff(['--cached', '--quiet']);
    // why diffSummary insteadof diff?
    // >> git diff --quite option indicates if there are any changes by exit code.
    // >> However, simple-git does not provide this option.

    const gitDiffSummray = await git.diffSummary();
    const gitDiffCachedSummray = await git.diffSummary(['--cached']);
    // const gitDiffCachedSummray = await git.diffSummary(['--staged']);
    logv('gitDiffSummary', gitDiffSummray, gitDiffCachedSummray);
    if (gitDiffSummray.files.length > 0 || gitDiffCachedSummray.files.length > 0) {
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
  }

  let hasLocalBranch = false;
  let branchLocal = await git.branchLocal();
  for (const b of branchLocal.all) {
    if (b === task.branch) {
      hasLocalBranch = true;
      break;
    }
  }

  if (task.checkLocalChanges) {
    await git.fetch(remote, branchLocal.current);
    let hasUnpushedCommits = false;
    try {
      hasUnpushedCommits = await checkUnpushedCommits(git, remote, branchLocal.current);
    } catch (e) {
      logw(e);
    }
    if (hasUnpushedCommits) {
      throw Error(
        `You have local commits that are not pushed to ${remote}/${task.branch}. Please push, stash, or discard them before running this script.`
      );
    }
  }

  await git.fetch(remote, task.branch);
  if (task.checkLocalChanges) {
    let hasUnpushedCommits = false;
    try {
      hasUnpushedCommits = await checkUnpushedCommits(git, remote, task.branch);
    } catch (e) {
      logw(e);
    }
    if (hasUnpushedCommits) {
      throw Error(
        `You have local commits that are not pushed to ${remote}/${task.branch}. Please push, stash, or discard them before running this script.`
      );
    }
  }

  const startPoint: string = task.startPoint ?? '';
  if (!hasLocalBranch) {
    await git.checkoutBranch(task.branch, `${remote}/${task.branch}`);
  }

  branchLocal = await git.branchLocal();
  if (branchLocal.current !== task.branch) {
    await git.checkout(task.branch);
  }

  if (isEmpty(startPoint)) {
    await git.reset(ResetMode.HARD, [`${remote}/${task.branch}`]);
  } else {
    await git.reset(ResetMode.HARD, [startPoint]);
  }
};

const checkUnpushedCommits = async (git: SimpleGit, remote: string, branch: string) => {
  const localHash = await git.revparse(branch);
  const remoteHash = await git.revparse(`${remote}/${branch}`);

  if (!localHash || !remoteHash) {
    logw(
      `Warning: Cannot determine local or remote hash for '${branch}'/'${remote}/${branch}'. Skipping unpushed commit check.`
    );
  } else {
    if (localHash !== remoteHash) {
      //ahead would be if local is ahead of remote : 1       0
      const ahead = await git.raw(['rev-list', '--left-right', '--count', `${branch}...${remote}/${branch}`]);
      const aheadArr = ahead.split(/\s*/);
      logv(`Ahead: `, aheadArr);
      const aheadCountStr = aheadArr[0];
      if (isNotNil(aheadCountStr) && aheadCountStr.length > 0) {
        const aheadCount = Number(aheadCountStr);
        if (aheadCount > 0) {
          return true;
        }
      }
    }
  }

  return false;
};
