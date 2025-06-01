import { usefulTasks } from '@/useful_tasks';
import { prepare } from '@/build_cli_parser';
import { buildTestPath, prepareTestSuite, prepareTestInstance } from '@/__tests__/testUtils';
import fse from 'fs-extra';
import simpleGit from 'simple-git';
import path from 'path';

describe('git-setup', () => {
  // const { testDir } = prepareTestSuite(__dirname, false, 'git-setup-test');
  const { testDir } = prepareTestSuite(__dirname);

  it('git-setup', async () => {
    // const itObj = prepareTestInstance(testDir, 'git-setup-test');
    const itObj = prepareTestInstance(testDir);

    const testOriginRepo = buildTestPath(testDir, 'test-origin-repo');
    const testBranch = 'main';

    if (fse.existsSync(testOriginRepo)) {
      fse.removeSync(testOriginRepo);
    }

    fse.mkdirpSync(testOriginRepo);
    const git = simpleGit(testOriginRepo);
    await git.init();
    await git.addConfig('user.name', 'test');
    await git.addConfig('user.email', 'test@test.com');

    await git.checkoutLocalBranch(testBranch);

    const addFileAndCommit = async (fileName: string) => {
      const testFile = buildTestPath(testOriginRepo, fileName);
      fse.writeFileSync(testFile, 'test');
      await git.add('.');
      return await git.commit(`Add ${fileName}`);
    };

    await addFileAndCommit('test.txt');
    const test2CommitResult = await addFileAndCommit('test2.txt');
    const test3CommitResult = await addFileAndCommit('test3.txt');

    const localPath1 = buildTestPath(itObj.instanceCwd, 'local1');
    const localPath2 = buildTestPath(itObj.instanceCwd, 'local2');
    const setupResult = prepare([]);
    await usefulTasks(
      itObj.instanceCwd,
      setupResult.opt,
      {
        name: 'BaseTask',
        env: {
          logLevel: 'debug',
        },

        tasks: [
          {
            type: 'git-setup',
            localPath: localPath1,
            url: path.resolve(testOriginRepo),
            branch: testBranch,
            remote: 'origin',
            updateSubmodules: true,
            // updateSubmodules: ['submodules/test2'],
            // startPoint: 'testpoint',
          },

          {
            type: 'git-setup',
            localPath: localPath2,
            url: path.resolve(testOriginRepo),
            branch: testBranch,
            remote: 'origin',
            updateSubmodules: true,
            // updateSubmodules: ['submodules/test2'],
            startPoint: test2CommitResult.commit,
          },
        ],
      },
      setupResult.program
    );

    const local1Git = simpleGit(localPath1);
    const local2Git = simpleGit(localPath2);

    const local1CurrentCommit = await local1Git.revparse(testBranch);
    const local2CurrentCommit = await local2Git.revparse(testBranch);

    expect(local1CurrentCommit).toBe(test3CommitResult.commit);
    expect(local2CurrentCommit).toBe(test2CommitResult.commit);
  });
});
