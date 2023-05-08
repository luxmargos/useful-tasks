import fs from 'fs';
import path from 'path';

const loadJson = (filePath:string)=>{
    if(!fs.existsSync(filePath)){
        throw new Error(`The Path '${filePath}' does not exists!`);
    }

    const fileString = fs.readFileSync(filePath, {encoding:'utf-8'});
    return JSON.parse(fileString);
};


export const loadJsonConfig = (filePath:string)=>{
    let configJson = loadJson(filePath);
    if(configJson.extends){
        const filePathDir = path.dirname(filePath);
        const extendsFilePath = path.resolve(filePathDir, configJson.extends);
        configJson = Object.assign({}, configJson, loadJsonConfig(extendsFilePath));
    }

    return configJson;
};
