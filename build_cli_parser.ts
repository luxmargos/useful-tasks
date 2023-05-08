import { program } from 'commander';
import packageJson from './package.json'
import path from 'path';
import fs from 'fs';


export interface CliOptions {
    cwd?:string;
    config?:string;
}

export const setup = ()=> {
    console.log("######################################################################")
    console.log("Dependency resolver : Parsing cli-arguments");
    console.log("######################################################################")

    console.log('cwd', process.cwd());
    console.log('argv', process.argv);

    program.name('dependency-resolver').version(packageJson.version)
    .option('--cwd <string>','Change working directory')
    .option('--config <string>','A Home directory of godot source');

    program.parse();

    const opts = program.opts();
    const typedOptions = opts as CliOptions;
    console.log(`Using options : ${JSON.stringify(typedOptions, undefined, 2)}`);

    if(typedOptions.cwd){
        process.chdir(path.resolve(typedOptions.cwd));
    }

    return typedOptions;
}

