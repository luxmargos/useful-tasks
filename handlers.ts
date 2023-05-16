import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import {CheckRepoActions, ResetMode, simpleGit} from 'simple-git';
import fsExtra, { copySync, mkdirpSync } from 'fs-extra'
import { removeSync } from 'fs-extra';
import debug from 'debug';
import { TAG, Task, TaskContext, TaskOutput, TaskSetValue, TaskGitCheckout, TaskSymlink, TaskTerminalCommand, TaskOutputTargets, TaskFsCopy, TaskFsDelete } from './task_data';

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

export const handleGetValue = async (context:TaskContext, task:TaskSetValue)=>{
    if(task.key === undefined || !task.key || typeof(task.key) !== 'string' || task.key.length < 1){
        throw new Error(`Invalid key ${task.key}. It must be a string.`);
    }
    
    let value = task.value;
    if(task.valueType === 'file'){
        if(typeof(value) !== 'string'){
            throw new Error(`The "value" must contain path of a file with "valueType":"${task.valueType}"`);
        }
        
        const valuePath = path.resolve(value);
        if(!fs.existsSync(valuePath)){
            throw new Error(`File "${valuePath}" does not exist to use as a value`);
        }

        value = fs.readFileSync(valuePath ,{encoding:'utf8'});
        if(task.fileFormat === 'json'){
            value = JSON.parse(value);
        }
    }

    vlog(`Setting up the value ${value} for a key ${task.key}`);
    context.values[task.key] = value;
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
    copySync(task.src, task.dest);
}
export const handleFsDelete = async (context:TaskContext, task:TaskFsDelete)=>{
    removeSync(task.path);
}

export const applyValues = async (context:TaskContext, task:Task)=>{
    const anyTypeTask:any = task as any;
        Object.keys(anyTypeTask).forEach(key => {
            if(anyTypeTask[key] !== undefined && typeof(anyTypeTask[key]) ==='string'){
                let valueOfKey:string = anyTypeTask[key];
                while(true){
                    const match = context.valueReplaceReg.exec(valueOfKey);
                    if(match === null || match === undefined){
                        break;
                    }
                    
                    const matchedStr = match[0];
                    const varPath = match[1];

                    let currentValue = context.values;
                    if(varPath.length > 0){
                        const varPaths = varPath.split(".");
                        for(let i=0; i<varPaths.length;i++){
                            const varEl = varPaths[i];
                            if(currentValue.hasOwnProperty(varEl)){
                                currentValue = currentValue[varEl];
                            }else{
                                throw new Error(`The value of ${varPath} could not be found!`);
                            }
                        }
                    }

                    const valuePrefix = valueOfKey.substring(0, match.index);
                    const valueReplace = `${currentValue}`;
                    const valueSuffix = valueOfKey.substring(match.index+matchedStr.length);                    
                    valueOfKey = `${valuePrefix}${valueReplace}${valueSuffix}`;
                    vlog(`Updated value ${valueOfKey}`);
                }
                
                anyTypeTask[key] = valueOfKey;
            }
        });
};