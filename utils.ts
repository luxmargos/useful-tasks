import fs from 'fs';
import path from 'path';
import json5 from 'json5';

export const loadJson = (filePath:string)=>{
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

export const convertOrNotHyphenTextToCamelText=(text:string, flag:boolean)=>{
    if(!flag){
        return text;
    }

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



export const containsTag = (elements:string[], tags:string[] | string | undefined | null)=>{
    if(tags === undefined || tags === null){
        return false;
    }
    
    let targetTags = typeof(tags) === 'string' ? [tags] : tags;
    targetTags = targetTags.map((a)=>{ return a.trim(); });
     
    for(const el of elements){
        if(el.length < 1){
            continue;
        }
        for(const tag of targetTags){
            if(tag.length < 1){
                continue;
            }

            if(el === tag){
                return true;    
            }
        }        
    }

    return false;
};