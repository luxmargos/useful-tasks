import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import {CheckRepoActions, ResetMode, simpleGit} from 'simple-git';

import { CliOptions, setup } from './build_cli_parser';
import { loadJsonConfig } from './utils';

import { fstat, removeSync } from 'fs-extra';
import debug from 'debug';
import { TAG, Task, TaskGitCheckout, TaskSymlink, TaskTerminalCommand } from './task_data';

const vlog = debug(TAG);

export const handleGitRepoSetup = async (task:TaskGitCheckout)=>{
    const localPath = path.resolve(task.localPath);

    if(!fs.existsSync(localPath)){
        fs.mkdirSync(localPath, {recursive:true});
    }

    if(fs.readdirSync(localPath).length === 0){
        if(task.url){
            await simpleGit().clone(task.url, localPath);
        }
    }

    const git = simpleGit(localPath, {binary:task.binary});

    const isGitRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
    if(!isGitRepo){
        throw Error(`${localPath} is not a git repository!!!`);
    }

    
    if(task.updateSubmodules){
        await git.submoduleInit();
        await git.submoduleUpdate();
    }else{
        // const submodules = task.updateSubmodules ?? [];
        // for(var submod of submodules){
        // }
    }

    await git.fetch();

    if(task.branch){
        let hasLocalBranch = false;
        const branchLocal = await git.branchLocal();
        for(var b of branchLocal.all){
            if(b === task.branch){
                hasLocalBranch = true;
                break;
            }
        }

        const branch = task.branch ?? "";
        const startPoint:string = task.startPoint ?? "";

        if(!hasLocalBranch){
            await git.checkoutBranch(branch, startPoint)
        }else{
            if(branchLocal.current !== task.branch){
                await git.checkout(branch);
            }
            await git.reset(ResetMode.HARD, [startPoint])
        }
    }
}

export const handleSymlink = async (task:TaskSymlink)=>{
    const target:string = path.resolve(task.target);
    const dstPath:string = path.resolve(task.path);

    if(fs.existsSync(dstPath)){
        const lstat:fs.Stats = fs.lstatSync(dstPath);
        vlog(`LSTAT is symlink? ${lstat.isSymbolicLink()}, is directory? ${lstat.isDirectory()}`);
        if(task.forced){
            if(lstat.isSymbolicLink() || lstat.isFile()){
                vlog(`Unlink ${dstPath}`);
                fs.unlinkSync(dstPath);
            }else if(lstat.isDirectory()){
                vlog(`Remove directory '${dstPath}'`);
                removeSync(dstPath);
            }
        }
    }

    if(fs.existsSync(dstPath)){
        vlog(`Could not create symbolic link cause '${dstPath}' already exists`);
        // throw Error()
    }else{
        vlog(`Create symbolic link ${target} => ${dstPath}`);
        fs.symlinkSync(target, dstPath, task.linkType);
        const lstat:fs.Stats = fs.lstatSync(dstPath);
        vlog(`LSTAT is symlink? ${lstat.isSymbolicLink()}, is directory? ${lstat.isDirectory()}`);
    }
}

export const handleTerminalCommand = async (task:TaskTerminalCommand)=>{
    vlog(`Start execution... ${task.cmd}`);
    execSync(task.cmd,{
        shell: task.shell,
        // cwd: cwd, 
        env: process.env,
        stdio: [process.stdin, process.stdout, process.stderr],
        encoding: 'utf-8'
    })
}