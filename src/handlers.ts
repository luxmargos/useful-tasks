import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import {CheckRepoActions, ResetMode, simpleGit} from 'simple-git';
import { CopyOptionsSync, CopySyncOptions, copyFileSync, copySync, mkdirpSync, removeSync } from 'fs-extra'
import { TaskContext, TaskOutput, TaskSetVar, TaskGitCheckout, TaskSymlink, TaskTerminalCommand, TaskOutputTargets, TaskFsCopy, TaskFsDelete, TaskEnvVar, TaskRegexReplace, RegexData, RegexFriendly } from './task_data';
import { loadJson } from './utils';
import json5 from 'json5';
import { setEnvVar, setTaskVar } from './task_utils';
import { logi, logv } from './loggers';
import { glob, globSync } from 'glob';

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
        logv(`LSTAT is symlink? ${lstat.isSymbolicLink()}, is directory? ${lstat.isDirectory()}`);
        if(task.forced){
            if(lstat.isSymbolicLink() || lstat.isFile()){
                logv(`Unlink ${dstPath}`);
                fs.unlinkSync(dstPath);
            }else if(lstat.isDirectory()){
                logv(`Remove directory '${dstPath}'`);
                removeSync(dstPath);
            }
        }
    }

    if(fs.existsSync(dstPath)){
        logv(`Could not create symbolic link cause '${dstPath}' already exists`);
        // throw Error()
    }else{
        logv(`Create symbolic link ${target} => ${dstPath}`);
        fs.symlinkSync(target, dstPath, task.linkType);
        const lstat:fs.Stats = fs.lstatSync(dstPath);
        logv(`LSTAT is symlink? ${lstat.isSymbolicLink()}, is directory? ${lstat.isDirectory()}`);
    }
}

export const handleTerminalCommand = async (context:TaskContext, task:TaskTerminalCommand)=>{
    logv(`Start execution... ${task.cmd}`);
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
    
    let value = task.value;
    //old version support
    if((value === undefined || value === null) && task.var){
        value = task.var;
    }

    if(task.isFallback !== true){
        task.isFallback = false;
    }

    if(task.varType === 'file'){
        if(typeof(value) !== 'string'){
            throw new Error(`The "value" must contain path of a file with "varType":"${task.varType}"`);
        }
        
        const varsPath = path.resolve(value);
        if(!fs.existsSync(varsPath)){
            throw new Error(`File "${varsPath}" does not exist to use as a variable`);
        }

        value = fs.readFileSync(varsPath ,{encoding:'utf8'});
        if(task.fileFormat === 'json'){
            value = json5.parse(value);
        }
    }

    setTaskVar(context, task.key, value, task.isFallback);
}


export const handleEnvVar = async (context:TaskContext, task:TaskEnvVar)=>{
    let value = task.value;

    //old version support
    if((value === undefined || value === null) && task.var){
        value = task.var;
    }

    if(task.isFallback !== true){
        task.isFallback = false;
    }
    const isFallback:boolean = task.isFallback;
    
    if(task.varType === 'file'){
        if(typeof(value) !== 'string'){
            throw new Error(`The "value" must contain path of a file with "varType":"${task.varType}"`);
        }
        
        const varsPath = path.resolve(value);
        value = loadJson(varsPath);
    }

    if(typeof(value) !== 'object'){
        throw new Error(`The content of the "value" must be in the form of key-value pairs. For example: {"KEY_A":"value_a", "KEY_B":"value_b"}`);
    }

    Object.keys(value).forEach(key => {
        setEnvVar(context, key, value[key], isFallback);
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

const tryConvertToRegExpArray = (v?:RegexFriendly, defaultValue?:RegExp[] | undefined):RegExp[] | undefined =>{
    if(v === undefined){
        return defaultValue;
    }

    const isRegexData = (v:any)=>{
        if(typeof(v) === 'object' && 'pattern' in v && typeof(v.pattern) === 'string'){
            return true;
        }
        return false;
    };
    const isStringOrRegexData = (s:any) => typeof(s) === 'string' || isRegexData(s);

    let tempInclude:any[] = [];
    if(typeof(v) === 'string'){
        tempInclude = [v];
    }else if(Array.isArray(v)){
        tempInclude = v.filter(isStringOrRegexData);
    }else if(isRegexData(v)){
        tempInclude = [v];
    }

    return tempInclude.map((v:any)=>{
        if(typeof(v) === 'string'){
            return new RegExp(v);
        }else if(isRegexData(v)){
            const regexData = v as RegexData;
            return new RegExp(regexData.pattern, regexData.flags);
        }

        throw new Error(`Invalid filter, the format is required such as 'string', {"pattern":"..."}`);
    });
};

const resolveStringArray = (val:string | string[] | undefined | null, defaultValue:string[]):string[]=>{
    if(val !== undefined && val !== null){
        if(typeof(val) === 'string'){
            return [val];
        }else if(Array.isArray(val)){
            return val.filter((v)=>typeof(v)==='string');
        }
    }

    return [];
};

const runCopy = (src:string, dst:string, options:CopySyncOptions)=>{
    logv(`Copy: ${src} => ${dst}`);
    copySync(src,dst,options);
};

export const handleFsCopy = async (context:TaskContext, task:TaskFsCopy)=>{
    if(!fs.existsSync(task.src)){
        throw new Error(`The source '${task.src}' does not exist`);
    }
    
    const conflict = task?.options?.conflict;
    let overwrite = conflict === undefined || conflict === null || (typeof(conflict) === 'string' && conflict.trim() === 'overwrite');

    /** @deprecated support migrate from '0.1.18' */ 
    if(task.options && 'overwrite' in task?.options && typeof(task?.options?.overwrite) === 'boolean'){
        overwrite = task.options.overwrite;
    }

    const opt:CopyOptionsSync = {
        overwrite:overwrite
    };
    
    if(fs.statSync(task.src).isDirectory() === false){
        runCopy(task.src, task.dest, opt);
        return;
    }

    const includes:string[] = resolveStringArray(task.include, []);
    const excludes:string[] = resolveStringArray(task.exclude, []);

    const runGlobSync = (items:string[])=>{
        for(const f of items){
            const from = path.join(task.src, f);
            const to = path.join(task.dest, f);
            runCopy(from, to, opt);
        }
    };

    const ilen = includes.length > 0;
    const elen = excludes.length > 0;
    if(!ilen && elen){
        runGlobSync(globSync('**', {ignore:excludes, cwd:task.src}));
    }else if(ilen && !elen){
        runGlobSync(globSync(includes, { cwd:task.src}));
    }else if(ilen && elen){
        runGlobSync(globSync(includes, {ignore:excludes, cwd:task.src}));
    }else{
        runCopy(task.src, task.dest, opt);
    }
}

const runDelete = (path:string)=>{
    logv(`Delete: ${path}`);
    removeSync(path);
};

export const handleFsDelete = async (context:TaskContext, task:TaskFsDelete)=>{
    if(!fs.existsSync(task.path)){
        logv(`The '${task.path}' does not exist and cannot be deleted`);
        return;
    }

    if(fs.statSync(task.path).isDirectory() === false){
        runDelete(task.path);
        return;
    }

    const includes:string[] = resolveStringArray(task.include, []);
    const excludes:string[] = resolveStringArray(task.exclude, []);

    const runGlobSync = (items:string[])=>{
        for(const f of items){
            runDelete(path.join(task.path, f));
        }
    };

    const ilen = includes.length > 0;
    const elen = excludes.length > 0;
    if(!ilen && elen){
        runGlobSync(globSync('**', {ignore:excludes, cwd:task.path}));
    }else if(ilen && !elen){
        runGlobSync(globSync(includes, { cwd:task.path}));
    }else if(ilen && elen){
        runGlobSync(globSync(includes, {ignore:excludes, cwd:task.path}));
    }else{
        runDelete(task.path);
    }
}