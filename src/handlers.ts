import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import {CheckRepoActions, ResetMode, simpleGit} from 'simple-git';
import { copySync, mkdirpSync, removeSync } from 'fs-extra'
import debug from 'debug';
import { TAG, TaskContext, TaskOutput, TaskSetVar, TaskGitCheckout, TaskSymlink, TaskTerminalCommand, TaskOutputTargets, TaskFsCopy, TaskFsDelete, TaskEnvVar } from './task_data';
import { loadJson } from './utils';
import json5 from 'json5';
import { setEnvVar, setTaskVar } from './task_utils';

const vlog = debug(TAG);

export const handleGitRepoSetup = async (context:TaskContext, task:TaskGitCheckout)=>{
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

export const handleSymlink = async (context:TaskContext, task:TaskSymlink)=>{
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

export const handleTerminalCommand = async (context:TaskContext, task:TaskTerminalCommand)=>{
    vlog(`Start execution... ${task.cmd}`);
    execSync(task.cmd,{
        shell: task.shell,
        // cwd: cwd, 
        env: process.env,
        stdio: [process.stdin, process.stdout, process.stderr],
        encoding: 'utf-8'
    })
}


export const handleSetVar = async (context:TaskContext, task:TaskSetVar)=>{
    if(task.key === undefined || !task.key || typeof(task.key) !== 'string' || task.key.length < 1){
        throw new Error(`Invalid key ${task.key}. It must be a string.`);
    }
    
    let taskVar = task.var;
    if(task.varType === 'file'){
        if(typeof(taskVar) !== 'string'){
            throw new Error(`The "var" must contain path of a file with "varType":"${task.varType}"`);
        }
        
        const varsPath = path.resolve(taskVar);
        if(!fs.existsSync(varsPath)){
            throw new Error(`File "${varsPath}" does not exist to use as a variable`);
        }

        taskVar = fs.readFileSync(varsPath ,{encoding:'utf8'});
        if(task.fileFormat === 'json'){
            taskVar = json5.parse(taskVar);
        }
    }

    setTaskVar(context, task.key, taskVar);
}


export const handleEnvVar = async (context:TaskContext, task:TaskEnvVar)=>{
    let taskVar = task.var;
    if(task.varType === 'file'){
        if(typeof(taskVar) !== 'string'){
            throw new Error(`The "var" must contain path of a file with "varType":"${task.varType}"`);
        }
        
        const varsPath = path.resolve(taskVar);
        taskVar = loadJson(varsPath);
    }

    if(typeof(taskVar) !== 'object'){
        throw new Error(`The content of the "var" must be in the form of key-value pairs. For example: {"KEY_A":"value_a", "KEY_B":"value_b"}`);
    }

    Object.keys(taskVar).forEach(key => {
        setEnvVar(context, key, taskVar[key]);
    });
}

export const handleOutput = async (context:TaskContext, task:TaskOutput)=>{
    const text = task.text ?? '';
    const target:TaskOutputTargets = (task.target ?? 'c').trim() as TaskOutputTargets;
    const targetPath = task.path;
    
    if(target === 'c' || target === 'console'){
        console.log(text);
    }else{
        if(!targetPath){
            throw new Error(`The parameter 'path' is required for a target '${target}'!`);
        }

        const resolvedPath = path.resolve(targetPath);
        const dir = path.dirname(resolvedPath);
        if(!fs.existsSync(dir)){
            mkdirpSync(dir);
        }

        if(target == 'fa' || target == 'file-append'){
            let err;
            let fd;
            try{
                fd = fs.openSync(resolvedPath,'a');
                fs.appendFileSync(fd, text, 'utf8');
            }catch(e){
                err = e;
            }finally{
                if(fd !== undefined){
                    fs.closeSync(fd);
                }
            }

            if(err){
                throw err;
            }
        }else{
            fs.writeFileSync(resolvedPath, text);
        }
    }
}

export const handleFsCopy = async (context:TaskContext, task:TaskFsCopy)=>{
    let overwrite = task?.options?.conflict !== 'skip';

    /** @deprecated support migrate from '0.1.18' */ 
    if(task.options && 'overwrite' in task?.options && typeof(task?.options?.overwrite) === 'boolean'){
        overwrite = task.options.overwrite;
    }
    
    copySync(task.src, task.dest,{overwrite});
}

export const handleFsDelete = async (context:TaskContext, task:TaskFsDelete)=>{
    removeSync(task.path);
}