import path from 'path';
import { CliOptions, setup } from './build_cli_parser';
import { loadJsonConfig } from './utils';
import debug from 'debug';
import { DepsJson, TAG, TaskGitCheckout, TaskSymlink, TaskTerminalCommand } from './task_data';
import { handleTerminalCommand, handleGitRepoSetup, handleSymlink } from './handlers';

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
    const tasks = depsJson.tasks ?? [];
    const taskCount = tasks.length ?? 0;
    for(let i=0;i<taskCount; i++){
        const task = tasks[i];

        if(task.enabled === false){
            vlog(`Pass the task without execution => ${i}/${task.type}`);
            continue;
        }else{
            vlog(`Task : ${i}/${task.type}`)
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
            await handleGitRepoSetup(task as TaskGitCheckout);
        }else if(task.type === 'symlink'){
            await handleSymlink(task as TaskSymlink);
        }else if(task.type === 'cmd'){
            await handleTerminalCommand(task as TaskTerminalCommand);
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