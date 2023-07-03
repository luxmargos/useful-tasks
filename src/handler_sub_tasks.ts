import stringArgv from 'string-argv';
import { TAG, TaskContext, TaskSubTasks } from './task_data';
import debug from 'debug';
import { usefulTasks } from './useful_tasks';
import { setup } from './build_cli_parser';

const vlog = debug(TAG);

export const handleSubTasks = async (context:TaskContext, task:TaskSubTasks)=>{
    if(!task.args || typeof(task.args) !== 'string'){
        throw new Error(`Found missing or invalid property 'args' that is required`);
    }

    const subArgv = stringArgv(task.args);
    const setupResult = setup(subArgv);
    usefulTasks(context.originCwd, setupResult.opt, setupResult.program);
}
