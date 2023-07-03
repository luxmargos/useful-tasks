import path from 'path';
import { Options, setup } from './build_cli_parser';
import { containsAllTag, containsTag, convertOrNotHyphenTextToCamelText, loadJsonConfig } from './utils';
import debug from 'debug';
import { Config, TAG, Task, TaskContext, DEFAULT_REPLACE_REGEX, VAR_FROM_ARGUMENT_PREFIX,  ENV_VAR_FROM_ARGUMENT_PREFIX } from './task_data';
import { applyVariables, searchExtraKeyValue, setTaskVar, setEnvVar } from './task_utils';
import { Command } from 'commander';
import { handlerMap } from './handler_map';

export const usefulTasks = (originCwd:string, opt:Options, program:Command)=>{
    let tasksConfig:Config = {};

    let configFilePath = path.resolve(opt.config);
    try{
        tasksConfig = loadJsonConfig(configFilePath);
    }catch(e:any){
        if(e instanceof Error){
            console.log(e.message);
        }else{
            console.log(e);
        }
        console.log("");
        program.help();
    }
    
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
        originCwd,
        baseCwd,
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
    
    vlog("");
    vlog(`[${tasksConfig.name}] Start task processing`);
    
    const getTaskRepresentStr = (task:Task, i?:number)=>{ 
        if(i !== undefined && i !== null){
            return task.id !== undefined ? `[${i}]${task.id}/${task.type}` : `[${i}]${task.type}`;
        }else{
            return task.id !== undefined ? `${task.id}/${task.type}` : `${task.type}`;
        }
    };
    
    const runTasks = async ()=>{
        let tasks:Array<Task> = tasksConfig.tasks ?? [];
    
        for(let i=0;i<tasks.length;i++){
            const task = tasks[i];

            // Validate task IDs
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

            if(!task.type || !(task.type in handlerMap)){
                throw new Error(`Found the invalid task type '${task.type}'`);
            }
            
            task.__compare__elements = [];
            if(task.id){
                task.id = task.id.trim()
                task.__compare__elements.push(task.id.trim());
            }
            if(task.tags){
                const printInvalidTags = (tags:any)=>{
                    vlog(`Ignoring invalid tags '${tags}'`);
                };
                if(typeof(task.tags) === 'string'){
                    if(task.tags.length > 0){
                        task.tags = task.tags.trim();
                        task.__compare__elements.push(task.tags);
                    }else{
                        printInvalidTags(task.tags);
                    }
                }else if(Array.isArray(task.tags)){
                    task.tags = task.tags.map((value:string)=>value.trim());
                    for(const tag of task.tags){
                        if(typeof(tag) === 'string' && tag.length>0){
                            task.__compare__elements.push(tag);
                        }else{
                            printInvalidTags(tag);
                        }
                    }
                }else{
                    printInvalidTags(task.tags);
                }
            }
        }
    
        if(opt.exclude && opt.exclude.length > 0){
            const excludeItems = opt.exclude;
    
            vlog(`Excluding tasks by specified IDs or Tags : --exclude=${excludeItems}`);
                tasks = tasks.filter((taskItem:Task, index:number, array:Task[])=>{
                if(containsTag(excludeItems, taskItem.__compare__elements) === false){
                    return taskItem;
                }
            });
        }
        if(opt.excludeCta && opt.excludeCta.length > 0){
            const excludesItems = opt.excludeCta;
    
            vlog(`Excluding tasks by specified IDs or Tags : --exclude-cta=${excludesItems}`);
                tasks = tasks.filter((taskItem:Task, index:number, array:Task[])=>{
                if(containsAllTag(excludesItems, taskItem.__compare__elements) === false){
                    return taskItem;
                }
            });
        }
        const hasIncludeFilters = opt.include && opt.include.length > 0;
        const hasIncludeCTAFilters = opt.includeCta && opt.includeCta.length > 0;
        if(hasIncludeFilters || hasIncludeCTAFilters){
            const includeItems = opt.include;
            const includeCtaItems = opt.includeCta;
    
            vlog(`Including tasks by specified IDs or Tags : --include=${includeItems} / --include-cta=${includeCtaItems}`);
            tasks = tasks.filter((taskItem:Task, index:number, array:Task[])=>{
                if(
                    (hasIncludeFilters && containsTag(includeItems!, taskItem.__compare__elements) === true)
                    ||
                    (hasIncludeCTAFilters && containsAllTag(includeCtaItems!, taskItem.__compare__elements) === true)
                ){
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
                vlog(`\n### Skip the task without execution => ${taskRepresentStr}`);
                continue;
            }else{
                vlog(`\n### Task : ${taskRepresentStr}`)
            }
    
            if(task.comment){
                vlog(task.comment);
            }
    
            if(task.cwd){
                const taskCwd = path.resolve(task.cwd);
                vlog(`Changing the current working directory => ${taskCwd}`);
                process.chdir(taskCwd);
            }
            
            const taskHandler = handlerMap[task.type];
            await taskHandler(context, task);
    
            if(!opt.cwdModeIsContinue){
                process.chdir(baseCwd);
            }
        }
    };
    
    runTasks().then(()=>{}).catch((reason:any)=>{
        throw reason;
    }).finally(()=>{
        process.chdir(baseCwd);
        vlog(`[${tasksConfig.name}] Tasks completed`);
        vlog("");
    });
};
