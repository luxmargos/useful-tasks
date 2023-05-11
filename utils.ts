import fs from 'fs';
import path from 'path';
import json5 from 'json5';

const loadJson = (filePath:string)=>{
    if(!fs.existsSync(filePath)){
        throw new Error(`The Path '${filePath}' does not exists!`);
    }

    const fileString = fs.readFileSync(filePath, {encoding:'utf-8'});
    return json5.parse(fileString);
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

export const convertHyphenTextToCamelText=(text:string)=>{
    let result = '';
    let textArr = text.split("-");
    for(let i=0;i<textArr.length;i++){
        let word = textArr[i];
        if(i===0){
            result = word;
        }else{
            if(word.length>0){
                word = `${word[0].toUpperCase()}${word.substring(1)}`;
            }
            result = `${result}${word}`;
        }
    }
    return result;
}