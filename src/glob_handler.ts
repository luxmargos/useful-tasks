import fs from 'fs';
import { globSync } from 'glob';

/**
 * 
 * @param handler 
 * @param cwd 
 * @param includes 
 * @param excludes 
 * @param includeAllForNonFilter 
 * @param subOptions 
 * @returns true - filters are applied, false - there was no filter to apply
 */
export const processWithGlobSync = (
    handler:(items:string[])=>void, cwd:string, 
    includes:string[], excludes:string[],
    skipDirs:boolean,
    includeAllIfNonFilters:boolean
    ):boolean =>{

    if(fs.statSync(cwd).isDirectory() === false){
        return false;
    }


    //pre apply filter for faster performance
    const nodir:boolean = skipDirs === true;

    const ilen:boolean = includes.length > 0;
    const elen:boolean = excludes.length > 0;
    if(!ilen && elen){
        //include all to apply excludes
        handler(globSync('**', {ignore:['.', ...excludes], cwd, nodir}));
        return true;
    }else if(ilen && !elen){
        //apply includes only
        handler(globSync(includes, { cwd, nodir}));
        return true;
    }else if(ilen && elen){
        //apply include and exclude
        handler(globSync(includes, {ignore:excludes, cwd, nodir}));
        return true;
    }else if(includeAllIfNonFilters){
        //include all to apply skipDirs, skipFiles
        handler(globSync('**', {ignore:['.'], cwd, nodir}));
        return true;
    }

    return false;
};