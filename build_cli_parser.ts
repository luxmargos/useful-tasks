import { program } from 'commander';
import packageJson from './package.json'
import path from 'path';

export const DEFAULT_CONFIG = "useful_tasks.json";

export interface CliOptions {
    cwd?:string;
    config:string;
    include?:string[];
    exclude?:string[];
    extraArgs?:string[];
}

export const setup = ()=> {
    console.log("######################################################################")
    console.log("Useful Tasks : Parsing cli-arguments");
    
    // console.log('cwd', process.cwd());
    // console.log('argv', process.argv);

    program.name('useful-tasks').version(packageJson.version)
    .option('--cwd <string>','Change working directory')
    .option('--config <string>','A path of json configuraion', DEFAULT_CONFIG)
    .option('--include <items>','Include specified task IDs to process. Comma separated e.g. my_task_01, my_task_02')
    .option('--exclude <items>','Exclude specified task IDs from process. Comma separated e.g. my_task_01, my_task_02')
    .allowUnknownOption(true);
    
    program.parse();

    const opts = program.opts();

    const typedOptions = opts as CliOptions;
    typedOptions.include = fixStringArrayArgument(typedOptions.include);
    typedOptions.exclude = fixStringArrayArgument(typedOptions.exclude);
    typedOptions.extraArgs = [...program.args ?? []];

    console.log(`Using options : ${JSON.stringify(typedOptions, undefined, 2)}`);
    // console.log(`Extra arguments`, program.args);

    if(typedOptions.cwd){
        process.chdir(path.resolve(typedOptions.cwd));
    }
    console.log("######################################################################")

    return typedOptions;
}

const fixStringArrayArgument = (value:string|string[]|undefined)=>{
    if(!value){
        return [];
    }
    
    if(typeof value === 'string'){
        const result:string[] = [];
        const arr = value.split(',');
        arr.forEach((value)=>{
            result.push(value.trim());
        });
        return result;
    }
    
    return value;
};
