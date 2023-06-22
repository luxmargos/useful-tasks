import { program } from 'commander';
import packageJson from './package.json'
import path from 'path';

export const DEFAULT_CONFIG = "useful_tasks.json";
export const DEFAULT_USE_CAMEL = true;

export interface CliOptions {
    cwd?:string;
    config:string;
    include?:string[];
    exclude?:string[];
    camelKeys:boolean;
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
    .option('-i, --include <items>','This parameter allows you to include certain tasks from the processing based on their task ID or tags.  Comma separated e.g. my_task_01, my_task_02')
    .option('-e, --exclude <items>','This parameter allows you to exclude certain tasks from the processing based on their task ID or tags. Comma separated e.g. my_task_01, my_task_02')
    .option('--camel-keys <boolean>','Specify whether to use camel case for the key of the variable. If the value is true, the paramter "--var-my-key" will be converted to "myKey" otherwise it will be "my-key"', DEFAULT_USE_CAMEL)
    .allowUnknownOption(true);
    
    program.parse();

    const opts = program.opts();

    const typedOptions = opts as CliOptions;
    typedOptions.include = fixStringArrayArgument(typedOptions.include);
    typedOptions.exclude = fixStringArrayArgument(typedOptions.exclude);
    if(typedOptions.camelKeys !== undefined && typeof(typedOptions.camelKeys) === 'string'){
        let v:string = typedOptions.camelKeys;
        v = v.trim().toLowerCase();
        if(v === 'false' || v === '0' || v === 'no'){
            typedOptions.camelKeys = false;
        }else if(v==='true' || v==='1' || v === 'yes'){
            typedOptions.camelKeys = true;
        }else{
            typedOptions.camelKeys = DEFAULT_USE_CAMEL;
        }
    }
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
