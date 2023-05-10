import path from 'path';
import { CliOptions, setup } from './build_cli_parser';
import { loadJsonConfig } from './utils';
import debug from 'debug';
import { DepsJson, TAG, Task, TaskContext, TaskEcho, TaskSetValue, TaskGitCheckout, TaskSymlink, TaskTerminalCommand, REGEX_REPLACE_VALUE } from './task_data';
import { handleTerminalCommand, handleGitRepoSetup, handleSymlink, handleGetValue, handleEcho, applyValues } from './handlers';

const opt:CliOptions = setup();

let depsJson:DepsJson = {};

let configFilePath = path.resolve(opt.config);
depsJson = loadJsonConfig(configFilePath);

let debugPat:string = '';
if(depsJson.verbose){
    debugPat = `${TAG}, ${TAG}:*`;
}

if(depsJson.verboseGit){
    debugPat = `${debugPat},simple-git,simple-git:*`;
}

if(debugPat){
    debug.enable(debugPat);
}

const vlog = debug(TAG);
const originCwd = path.resolve(process.cwd());

console.log("######################################################################")
console.log(`[${depsJson.name}] Start task processing`);

const runTasks = async ()=>{
    let tasks:Array<Task> = depsJson.tasks ?? [];

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
        vlog(`Excluding tasks by specified IDs : ${opt.exclude}`);
            tasks = tasks.filter((value:Task, index:number, array:Task[])=>{
            if(value.id === undefined || value.id === null || opt.exclude?.includes(value.id) === false){
                return value;
            }
        });
 
    }    
    if(opt.include && opt.include.length > 0){
        vlog(`Including tasks by specified IDs : ${opt.include}`);
        tasks = tasks.filter((value:Task, index:number, array:Task[])=>{
            if(value.id !== undefined && value.id !== null && opt.include?.includes(value.id) === true){
                return value;
            }
        });
    }
    
    const context:TaskContext = {
        values:{}
    };

    const taskCount = tasks.length ?? 0;
    for(let i=0;i<taskCount; i++){
        const task = tasks[i];
        applyValues(context, task);

        const taskRepresentStr = task.id !== undefined ? `${i}/${task.id}/${task.type}` : `${i}/${task.type}`;

        if(task.enabled === false){
            vlog(`Pass the task without execution => ${taskRepresentStr}`);
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
        }else if(task.type === 'set-value'){
            await handleGetValue(context, task as TaskSetValue);
        }else if(task.type === 'echo'){
            await handleEcho(context, task as TaskEcho);
        }

        process.chdir(originCwd);
    }
};

runTasks().then(()=>{}).catch((reason:any)=>{
    throw reason;
}).finally(()=>{
    process.chdir(originCwd);
    console.log(`[${depsJson.name}] Tasks completed`);
    console.log("######################################################################")
});
