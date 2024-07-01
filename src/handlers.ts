import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import {CheckRepoActions, ResetMode, simpleGit} from 'simple-git';
import { CopyOptionsSync, CopySyncOptions, copyFileSync, copySync, mkdirpSync, removeSync } from 'fs-extra'
import { TaskContext, TaskOutput, TaskSetVar, TaskGitCheckout, TaskSymlink, TaskTerminalCommand, TaskOutputTargets, TaskFsCopy, TaskFsDelete, TaskEnvVar, TaskContentReplace, RegexData } from './task_data';
import { checkEmptyStringOrThrow, checkLegacyUsage, checkTypeOrThrow, loadFileOrThrow, loadJson, parseJson, parseLines } from './utils';
import json5 from 'json5';
import { setEnvVar, setTaskVar } from './task_utils';
import { logi, logv } from './loggers';
import { processWithGlobSync } from './glob_handler';

const throwInvalidParamError = <T, K extends keyof T>(obj:T, key:K) => {
    throw new Error(`The parameter '${String(key)}' has an invalid value ${obj[key]}`);
};

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
    checkLegacyUsage(task,'var');
    checkLegacyUsage(task,'varType');
    checkLegacyUsage(task,'fileFormat');

    checkTypeOrThrow('key', task.key,['string']);
    checkEmptyStringOrThrow('key', task.key);
    
    if(task.isFallback !== true){
        task.isFallback = false;
    }
    const isFallback:boolean = task.isFallback;

    if(task.value !== undefined){
        const value = task.value;
        setTaskVar(context, task.key, value, isFallback);
    }
    
    if(!task.src) return;
    checkTypeOrThrow('src', task.src, ['string']);

    const src = task.src as string;
    const parser = task.parser || 'auto';
    logv(`Parser = ${parser}`);

    const runFunc = (filePath:string)=>{
        const varsPath = path.resolve(filePath);
        let obj: any | undefined;
        const content = loadFileOrThrow(varsPath);

        if(parser === 'auto' || parser === 'json'){
            try{
                logv("Trying to parse as JSON.");
                obj = parseJson(content);
            }catch(e){
                if(parser === 'json') throw e;
            }
        }

        if(!obj && (parser === 'auto' || parser === 'lines')){
            logv("Trying to parse as lines.")
            obj = parseLines(content);
        }

        if(!obj && (parser === 'auto' || parser === 'string')){
            obj = content;
        }

        setTaskVar(context, task.key, obj, isFallback);
    };
    
    const runGlobSync = (items:string[])=>{
        for(const f of items){
            const itemPath:string = path.join(src, f);
            if(fs.statSync(itemPath).isDirectory()){
                continue;
            }
            runFunc(itemPath);
        }
    };

    // ignore dirs, include all files on empty filters
    const handled = processWithGlobSync(runGlobSync, src, 
        resolveStringArray(task.include, []),
        resolveStringArray(task.exclude, []),
        true, true);

    // expect it is a single file
    if(!handled){
        runFunc(src);
    }
}

export const handleEnvVar = async (context:TaskContext, task:TaskEnvVar)=>{
    checkLegacyUsage(task,'var');
    checkLegacyUsage(task,'varType');
    checkLegacyUsage(task,'fileFormat');
    
    if(task.isFallback !== true){
        task.isFallback = false;
    }
    const isFallback:boolean = task.isFallback;

    if(task.value !== undefined){
        let value:any = task.value;
        if(typeof(value) === 'string'){
            logv("Trying to parse as lines.")
            value = parseLines(value);
        }
    
        Object.keys(value).forEach(key => {
            setEnvVar(context, key, value[key], isFallback);
        });
    }

    if(!task.src) return;
    
    checkTypeOrThrow('src', task.src, ['string']);
    const src = task.src as string;
    const parser = task.parser || 'auto';
    logv(`Parser = ${parser}`);

    const runFunc = (filePath:string)=>{
        const varsPath = path.resolve(filePath);
        let obj:Record<string,any> | undefined;
        const content = loadFileOrThrow(varsPath);

        if(parser === 'auto' || parser === 'json'){
            try{
                logv("Trying to parse as JSON.");
                obj = parseJson(content);
            }catch(e){
                if(parser === 'json') throw e;
            }
        }

        if(!obj && (parser === 'auto' || parser === 'lines')){
            logv("Trying to parse as lines.")
            obj = parseLines(content);
        }

        if(obj){
            const finalObj = obj;
            Object.keys(finalObj).forEach(key => {
                setEnvVar(context, key, finalObj[key], isFallback);
            });
        }
    };
    
    const runGlobSync = (items:string[])=>{
        for(const f of items){
            const itemPath:string = path.join(src, f);
            if(fs.statSync(itemPath).isDirectory()){
                continue;
            }
            runFunc(itemPath);
        }
    };

    // ignore dirs, include all files on empty filters
    const handled = processWithGlobSync(runGlobSync, src, 
        resolveStringArray(task.include, []),
        resolveStringArray(task.exclude, []),
        true, true);

    // expect it is a single file
    if(!handled){
        runFunc(src);
    }
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

    const cpOpt:CopyOptionsSync = { overwrite };
    
    const runGlobSync = (items:string[])=>{
        for(const f of items){
            const from = path.join(task.src, f);
            const to = path.join(task.dest, f);
            runCopy(from, to, cpOpt);
        }
    };

    // allow dir with glob, do nothing withtout filters
    const handled = processWithGlobSync(runGlobSync, task.src, 
        resolveStringArray(task.include, []),
        resolveStringArray(task.exclude, []),
        false, false);

    // copy the path is whatever
    if(!handled){
        runCopy(task.src, task.dest, cpOpt);
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

    const runGlobSync = (items:string[])=>{
        for(const f of items){
            runDelete(path.join(task.path, f));
        }
    };

    // allow dir with glob, do nothing withtout filters
    const handled = processWithGlobSync(runGlobSync, task.path, 
        resolveStringArray(task.include, []),
        resolveStringArray(task.exclude, []),
        false, false);

    // delete the path is whatever
    if(!handled){
        runDelete(task.path);
    }
}

const runFindAndReplaceWithRegex = (content:string, find:RegExp, replace:string, repeat:number):string=>{
    var text:string = content;
    if(repeat < 1){
        while(find.test(text)){
            text = text.replace(find, replace);
        }
    }else{
        for(var i=0;i<repeat;i++){
            if(find.test(text)){
                text = text.replace(find, replace);
            }
        }
    }
    return text;
};

const runFindAndReplaceWithText = (content:string, find:string, replace:string, repeat:number):string=>{
    var text:string = content;
    if(repeat < 1){
        while(text.indexOf(find) >= 0){
            text = text.replace(find, replace);
        }
    }else{
        for(var i=0;i<repeat;i++){
            if(text.indexOf(find) >= 0){
                text  = text.replace(find, replace);
            }
        }
    }
    return text;
};

const isRegexData = (v:any)=>{
    if(v !== undefined && v !== null && typeof(v) === 'object' && 'pattern' in v && typeof(v.pattern) === 'string'){
        return true;
    }
    return false;
};

type FindAndReplaceFunc = ((content:string, find:any, replace:string, repeat:number)=>string);

const findAndReplaceWithFile = (path:string, replaceFunc:FindAndReplaceFunc, find:string | RegExp, replace:string, repeat:number) => {
    logv(`Find and Replace: ${path}`);
    const content:string = fs.readFileSync(path, 'utf-8');
    const newContent = replaceFunc(content, find, replace, repeat);
    fs.writeFileSync(path, newContent, 'utf-8');
};

export const handleContentReplace = async (context:TaskContext, task:TaskContentReplace)=>{
    if(!fs.existsSync(task.path)){
        logv(`The '${task.path}' does not exist`);
        return;
    }

    if(task.replace === undefined || typeof(task.replace) !== 'string'){
        throwInvalidParamError(task, 'replace');
    }

    let loop:number = task.loop === undefined || task.loop === null? 1 : task.loop;
    if(typeof(loop) === 'string'){
        loop = parseInt(loop, 10);
    }else if(typeof(loop) !== 'number'){
        throwInvalidParamError(task, 'loop');
    }

    let find:string | RegExp;
    let replaceFunc:FindAndReplaceFunc;
    if(isRegexData(task.find)){
        const regexData = task.find as RegexData;
        find = new RegExp(regexData.pattern, regexData.flags);
        replaceFunc = runFindAndReplaceWithRegex;
    }else if(typeof(task.find) === 'string'){
        find = task.find;
        replaceFunc = runFindAndReplaceWithText;
    }else{
        throwInvalidParamError(task, 'find');
        return;
    }

    const runGlobSync = (items:string[])=>{
        for(const f of items){
            const itemPath:string = path.join(task.path, f);
            if(fs.statSync(itemPath).isDirectory()){
                continue;
            }
            findAndReplaceWithFile(path.join(task.path, f), replaceFunc, find, task.replace, loop);
        }
    };

    // ignore dirs, include all files on empty filters
    const handled = processWithGlobSync(runGlobSync, task.path, 
        resolveStringArray(task.include, []),
        resolveStringArray(task.exclude, []),
        true, true);

    // expect it is a single file
    if(!handled){
        findAndReplaceWithFile(task.path, replaceFunc, find, task.replace, loop);
    }
}

