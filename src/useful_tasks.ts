import path from 'path';
import { LogLevel, Options, logLevels } from './build_cli_parser';
import { containsAllTag, containsTag, loadJsonConfig } from './utils';
import debug from 'debug';
import { Config, TAG_DEBUG, Task, TaskContext, DEFAULT_REPLACE_REGEX, VAR_FROM_ARGUMENT_PREFIX,  ENV_VAR_FROM_ARGUMENT_PREFIX, LOG_TAG, TAG_INFO } from './task_data';
import { applyVariables, searchExtraKeyValue, setTaskVar, setEnvVar } from './task_utils';
import { Command } from 'commander';
import { handlerMap } from './handler_map';
import { logi, logv } from './loggers';

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
    
    let debugPat:string | undefined;
    
    let logLevel:LogLevel = 'info';
    let replaceRegex = DEFAULT_REPLACE_REGEX;
    if(tasksConfig.env && typeof(tasksConfig.env) === 'object'){
        const env = tasksConfig.env;
        
        if(env.verbose || env.verboseGit){
            logLevel = 'debug';
        }

        if(env.logLevel && logLevels.includes(env.logLevel)){
            logLevel = env.logLevel;
        }
    
        if(env.replaceRegex){
            replaceRegex = env.replaceRegex;
        }
    }

    //cli argument can overwrite json's logLeve
    if(opt.logLevel && logLevels.includes(opt.logLevel)){
        logLevel = opt.logLevel;
    }

    if(logLevel === 'debug'){
        // debugPat = `${LOG_TAG}:*`;
        debugPat = `${TAG_INFO},${TAG_DEBUG}`;
        debugPat = `${debugPat},simple-git,simple-git:*`;
    }else if(logLevel === 'info'){
        debugPat = `${TAG_INFO}`;
    }
    
    if(debugPat){
        debug.enable(debugPat);
    }

    logv(`CLI Options`, opt);

    if(typeof(replaceRegex) !== 'string'){
        throw new Error(`replaceRegex '${replaceRegex}'  must be a string`);
    }
    if(replaceRegex.length < 1){
        throw new Error(`replaceRegex '${replaceRegex}' cannot be empty`);
    }
    if(replaceRegex.indexOf('(') < 0 || replaceRegex.indexOf(')') < 0){
        throw new Error(`replaceRegex '${replaceRegex}' must contain regex group express '(' and ')'`);
    }
    
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
        logv("Setting up the variables from the additional arguments");
        searchExtraKeyValue(opt.extraArgs, VAR_FROM_ARGUMENT_PREFIX, opt.camelKeys, (key:string, value:string)=>{
            setTaskVar(context, key, value, false);
        });
    
        logv("Setting up the environment variables from the additional arguments");
        searchExtraKeyValue(opt.extraArgs, ENV_VAR_FROM_ARGUMENT_PREFIX, opt.camelKeys, (key:string, value:string)=>{
            setEnvVar(context, key, value, false);
        });
    }
    
    logi("");
    logi(`[${tasksConfig.name}] Start task processing`);
    
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
                    logv(`Ignoring invalid tags '${tags}'`);
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
    
            logv(`Excluding tasks by specified IDs or Tags : --exclude=${excludeItems}`);
                tasks = tasks.filter((taskItem:Task, index:number, array:Task[])=>{
                if(containsTag(excludeItems, taskItem.__compare__elements) === false){
                    return taskItem;
                }
            });
        }
        if(opt.excludeCta && opt.excludeCta.length > 0){
            const excludesItems = opt.excludeCta;
    
            logv(`Excluding tasks by specified IDs or Tags : --exclude-cta=${excludesItems}`);
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
    
            logv(`Including tasks by specified IDs or Tags : --include=${includeItems} / --include-cta=${includeCtaItems}`);
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
    
        logi(`Tasks : ${tasks.map((v,i)=>{ return getTaskRepresentStr(v,i);})}`);
    
        const taskCount = tasks.length ?? 0;
        for(let i=0;i<taskCount; i++){
            const task = tasks[i];
            applyVariables(context, task);
    
            const taskRepresentStr = getTaskRepresentStr(task,i);
            if(task.enabled === false){
                logi(`\n### Skip the task without execution => ${taskRepresentStr}`);
                continue;
            }else{
                logi(`\n### Task : ${taskRepresentStr}`)
            }
    
            if(task.comment){
                logi(task.comment);
            }
    
            let cwdHasChanges = false;
            if(task.cwd){
                const taskCwd = path.resolve(task.cwd);
                logi(`Changing the current working directory => ${taskCwd}`);
                cwdHasChanges = true;
                process.chdir(taskCwd);
            }
            
            const taskHandler = handlerMap[task.type];
            await taskHandler(context, task);
    
            if(!opt.cwdModeIsContinue){
                if(cwdHasChanges){
                    logi(`Restoring the current working directory => ${baseCwd}`);
                }
                process.chdir(baseCwd);
            }
        }
    };
    
    runTasks().then(()=>{}).catch((reason:any)=>{
        throw reason;
    }).finally(()=>{
        process.chdir(baseCwd);
        logi(`[${tasksConfig.name}] Tasks done\n`);
    });
};
