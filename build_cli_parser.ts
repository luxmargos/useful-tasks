import { program } from 'commander';
import packageJson from './package.json'
import path from 'path';

export const DEFAULT_CONFIG = "useful_tasks.json";

export interface CliOptions {
    cwd?:string;
    config:string;
}

export const setup = ()=> {
    console.log("######################################################################")
    console.log("Useful Tasks : Parsing cli-arguments");
    console.log("######################################################################")

    console.log('cwd', process.cwd());
    console.log('argv', process.argv);

    program.name('useful-tasks').version(packageJson.version)
    .option('--cwd <string>','Change working directory')
    .option('--config <string>','A path of json configuraion', DEFAULT_CONFIG);

    program.parse();

    const opts = program.opts();
    const typedOptions = opts as CliOptions;
    console.log(`Using options : ${JSON.stringify(typedOptions, undefined, 2)}`);

    if(typedOptions.cwd){
        process.chdir(path.resolve(typedOptions.cwd));
    }

    return typedOptions;
}