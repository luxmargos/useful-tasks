import { logv } from "./loggers";
import { Task, TaskContext } from "./task_data";
import { convertOrNotHyphenTextToCamelText, loadJson } from './utils';

export const applyVariables = async (context:TaskContext, task:Task)=>{
    const anyTypeTask:any = task as any;
    for(const key of Object.keys(anyTypeTask)) {
        if(typeof(key) !== 'string'){
            continue;
        }
        
        if(key === 'id' || key === 'tags'){
            continue;   
        }
        
        if(anyTypeTask[key] !== undefined && typeof(anyTypeTask[key]) ==='string'){
            let valueOfKey:string = anyTypeTask[key];
            while(true){
                const match = context.replaceRegex.exec(valueOfKey);
                if(match === null || match === undefined){
                    break;
                }
                
                const matchedStr = match[0];
                const varPath = match[1];

                let currentVar = context.vars;
                if(varPath.length > 0){
                    const varPaths = varPath.split(".");
                    for(let i=0; i<varPaths.length;i++){
                        const varEl = varPaths[i];
                        if(currentVar.hasOwnProperty(varEl)){
                            currentVar = currentVar[varEl];
                        }else{
                            throw new Error(`The value of ${varPath} could not be found!`);
                        }
                    }
                }

                const valuePrefix = valueOfKey.substring(0, match.index);
                const valueReplace = `${currentVar}`;
                const valueSuffix = valueOfKey.substring(match.index+matchedStr.length);                    
                valueOfKey = `${valuePrefix}${valueReplace}${valueSuffix}`;
                logv(`Variable injection: '${key}'=>'${valueOfKey}'`);
            }
            
            anyTypeTask[key] = valueOfKey;
        }
    }
};


export const searchExtraKeyValue = (extraArgs:string[], fmt:string, convertToCamelKeys:boolean, callback:(key:string, value:string)=>void)=>{
    let currentVarName:string|undefined;
    let useNextElementAsVar:boolean = false;
    
    for(let extraArg of extraArgs){
        const arg = extraArg.trim();
        if(arg === '--'){
            logv("Stop parsing by '--'")
            break;
        }

        if(useNextElementAsVar && currentVarName){
            const value = extraArg.startsWith("-") ? "":extraArg;
            callback(currentVarName, value);
            currentVarName = undefined;
            useNextElementAsVar = false;
        }else{
            const prefixIndex = extraArg.indexOf(fmt);
            if(prefixIndex >= 0){
                const equalMarkIndex = extraArg.indexOf("=");
                if(equalMarkIndex >= 0){
                    const varName = convertOrNotHyphenTextToCamelText(extraArg.substring(fmt.length, equalMarkIndex), convertToCamelKeys);
                    const value = extraArg.substring(equalMarkIndex+1);
                    callback(varName, value);
                }else{
                    currentVarName = convertOrNotHyphenTextToCamelText(extraArg.substring(fmt.length), convertToCamelKeys);
                    useNextElementAsVar = true;
                }
            }    
        }
    }
};


export const setTaskVar = (context:TaskContext, key:string, value:any, skipForExists:boolean)=>{
    if(skipForExists && context.vars[key] !== undefined){
        logv(`Skips assigning the variable ${key}=${value} because it already exists.`);
        return;
    }

    logv(`Sets the variable ${key}=${value}`);
    context.vars[key] = value;
}

export const setEnvVar = (context:TaskContext, key:string, value:any, skipForExists:boolean)=>{
    var valueType = typeof(value);
    if(valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean'){
        logv(`Ignoring the invalid typed(${valueType}) environment variable ${key}=${value}`);
    }else{
        const stringVal = String(value);
        if(stringVal.length < 1){
            logv(`Ignoring the invalid environment variable ${key}=${value}`);
        }else{
            if(skipForExists && process.env[key] !== undefined){
                logv(`Skips assigning the environment variable ${key}=${value} because it already exists.`);
                return;
            }

            logv(`Sets the environment variable ${key}=${value}`);
            process.env[key] = String(value);
        }
    }
}
