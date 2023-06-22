import path from 'path';
import { CliOptions, setup } from './build_cli_parser';
import { containsTag, convertOrNotHyphenTextToCamelText, loadJsonConfig } from './utils';
import debug from 'debug';
import { Config, TAG, Task, TaskContext, TaskOutput, TaskSetVar, TaskGitCheckout, TaskSymlink, TaskTerminalCommand, DEFAULT_REPLACE_REGEX, VAR_FROM_ARGUMENT_PREFIX, TaskFsCopy, TaskFsDelete, TaskEnvVar, ENV_VAR_FROM_ARGUMENT_PREFIX } from './task_data';
import { handleTerminalCommand, handleGitRepoSetup, handleSymlink, handleSetVar, handleOutput, applyVariables, handleFsCopy, handleFsDelete, handleEnvVar, searchExtraKeyValue, setTaskVar, setEnvVar } from './handlers';

const originCwd = path.resolve(process.cwd());
const opt:CliOptions = setup();

let tasksConfig:Config = {};

let configFilePath = path.resolve(opt.config);
tasksConfig = loadJsonConfig(configFilePath);

let debugPat:string = '';

let replaceRegex = DEFAULT_REPLACE_REGEX;
if(tasksConfig.env && typeof(tasksConfig.env) === 'object'){
    const env = tasksConfig.env;
    if(env.verbose){
        debugPat = `${TAG}, ${TAG}:*`;
    }
    
    if(env.verboseGit){
        debugPat = `${debugPat},simple-git,simple-git:*`;
    }

    if(env.replaceRegex){
        replaceRegex = env.replaceRegex;
    }
}

if(typeof(replaceRegex) !== 'string'){
    throw new Error(`replaceRegex '${replaceRegex}'  must be a string`);
}
if(replaceRegex.length < 1){
    throw new Error(`replaceRegex '${replaceRegex}' cannot be empty`);
}
if(replaceRegex.indexOf('(') < 0 || replaceRegex.indexOf(')') < 0){
    throw new Error(`replaceRegex '${replaceRegex}' must contain regex group express '(' and ')'`);
}

if(debugPat){
    debug.enable(debugPat);
}

const vlog = debug(TAG);
const baseCwd = path.resolve(process.cwd());

const context:TaskContext = {
    replaceRegex:new RegExp(replaceRegex),
    vars:{
        __env:{
            cwd_startup:originCwd,
            cwd_base:baseCwd
        }
    }
};

if(opt.extraArgs){
    vlog("Setting up the variables from the additional arguments");
    searchExtraKeyValue(opt.extraArgs, VAR_FROM_ARGUMENT_PREFIX, opt.camelKeys, (key:string, value:string)=>{
        setTaskVar(context, key, value);
    });

    vlog("Setting up the environment variables from the additional arguments");
    searchExtraKeyValue(opt.extraArgs, ENV_VAR_FROM_ARGUMENT_PREFIX, opt.camelKeys, (key:string, value:string)=>{
        setEnvVar(context, key, value);
    });
}

console.log("######################################################################")
console.log(`[${tasksConfig.name}] Start task processing`);

const getTaskRepresentStr = (task:Task, i?:number)=>{ 
    if(i !== undefined && i !== null){
        return task.id !== undefined ? `[${i}]${task.id}/${task.type}` : `[${i}]${task.type}`;
    }else{
        return task.id !== undefined ? `${task.id}/${task.type}` : `${task.type}`;
    }
};

const runTasks = async ()=>{
    let tasks:Array<Task> = tasksConfig.tasks ?? [];

    // Validate task IDs
    for(let i=0;i<tasks.length;i++){
        const task = tasks[i];
        if(task.id !== undefined && task.id !== null){
            if(typeof(task.id) !== 'string'){
                throw new Error(`The task id must be a 'string' type`);
            }

            if(task.id.length<1){
                throw new Error(`The task id cannot be empty`);
            }

            for(let j=i+1;j<tasks.length;j++){
                const otherTask = tasks[j];
                if(otherTask.id !== undefined && otherTask.id === task.id){
                    throw new Error(`The task id '${task.id}' must be unique`);
                }
            }    
        }
    }


    if(opt.exclude && opt.exclude.length > 0){
        const excludes = (opt.exclude ?? []).map((a)=>{ return a.trim(); });

        vlog(`Excluding tasks by specified IDs or Tags : ${excludes}`);
            tasks = tasks.filter((taskItem:Task, index:number, array:Task[])=>{
            if(taskItem.id === undefined || taskItem.id === null || (excludes.includes(taskItem.id) === false && containsTag(excludes, taskItem.tags) === false)){
                return taskItem;
            }
        });
 
    }    
    if(opt.include && opt.include.length > 0){
        const includes = (opt.include ?? []).map((a)=>{ return a.trim(); });
        vlog(`Including tasks by specified IDs or Tags : ${includes}`);
        tasks = tasks.filter((taskItem:Task, index:number, array:Task[])=>{
            if(taskItem.id !== undefined && taskItem.id !== null && includes?.includes(taskItem.id) === true){
                return taskItem;
            }

            if(containsTag(includes, taskItem.tags) == true){
                return taskItem;
            }
        });
    }

    vlog(`Tasks : ${tasks.map((v,i)=>{ return getTaskRepresentStr(v,i);})}`);

    const taskCount = tasks.length ?? 0;
    for(let i=0;i<taskCount; i++){
        const task = tasks[i];
        applyVariables(context, task);

        const taskRepresentStr = getTaskRepresentStr(task,i);
        if(task.enabled === false){
            vlog(`Skip the task without execution => ${taskRepresentStr}`);
            continue;
        }else{
            vlog(`Task : ${taskRepresentStr}`)
        }

        if(task.comment){
            vlog(task.comment);
        }

        if(task.cwd){
            const taskCwd = path.resolve(task.cwd);
            vlog(`Changing the current working directory => ${taskCwd}`);
            process.chdir(taskCwd);
        }
        
        if(task.type === 'git-repo-prepare'){
            await handleGitRepoSetup(context, task as TaskGitCheckout);
        }else if(task.type === 'symlink'){
            await handleSymlink(context, task as TaskSymlink);
        }else if(task.type === 'cmd'){
            await handleTerminalCommand(context, task as TaskTerminalCommand);
        }else if(task.type === 'set-var'){
            await handleSetVar(context, task as TaskSetVar);
        }else if(task.type === 'env-var'){
            await handleEnvVar(context, task as TaskEnvVar);
        }else if(task.type === 'output'){
            await handleOutput(context, task as TaskOutput);
        }else if(task.type === 'fs-copy'){
            await handleFsCopy(context, task as TaskFsCopy);
        }else if(task.type === 'fs-del'){
            await handleFsDelete(context, task as TaskFsDelete);
        }

        process.chdir(baseCwd);
    }
};

runTasks().then(()=>{}).catch((reason:any)=>{
    throw reason;
}).finally(()=>{
    process.chdir(baseCwd);
    console.log(`[${tasksConfig.name}] Tasks completed`);
    console.log("######################################################################")
});
