import path from 'path';
import { CliOptions, setup } from './build_cli_parser';
import { loadJsonConfig } from './utils';
import debug from 'debug';
import { DepsJson, TAG, TaskGitCheckout, TaskSymlink } from './task_data';
import { handleGitCheckout, handleSymlink } from './handlers';
const opt:CliOptions = setup();

let depsJson:DepsJson = {};

let configFilePath = path.resolve("./deps.json");
if(opt.config){
    configFilePath = path.resolve(opt.config);
}
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


const runTasks = async ()=>{
    const tasks = depsJson.tasks ?? [];
    const taskCount = tasks.length ?? 0;
    for(let i=0;i<taskCount; i++){
        const task = tasks[i];

        if(task.type === 'git-checkout'){
            await handleGitCheckout(task as TaskGitCheckout);
        }else if(task.type === 'symlink'){
            await handleSymlink(task as TaskSymlink);
        }
    }
};

runTasks().then(()=>{}).catch((reason:any)=>{
    throw reason;
});