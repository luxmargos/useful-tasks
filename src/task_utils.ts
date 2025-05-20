import { isNil } from 'es-toolkit';
import { logv, logw } from './loggers';
import { Task, TaskContext } from './task_data';
import { convertOrNotHyphenTextToCamelText, loadJson } from './utils';
import { get, isNotNil } from 'es-toolkit/compat';

export const replaceVarLiterals = async (context: TaskContext, task: Task) => {
  const anyTypeTask: any = task as any;
  for (const key of Object.keys(anyTypeTask)) {
    if (typeof key !== 'string') {
      continue;
    }

    if (key === 'id' || key === 'tags') {
      continue;
    }

    if (anyTypeTask[key] !== undefined && typeof anyTypeTask[key] === 'string') {
      let valueOfKey: string = anyTypeTask[key];
      while (true) {
        const envVarHandler = (value: string) => {
          context.envVarReplaceRegex.lastIndex = 0;
          const execArr = context.envVarReplaceRegex.exec(value);

          const isMatched = isNotNil(execArr);
          // example: ${var_name}, ${var_name.sub_name}, ${var_name[0]}
          const matchedStr = execArr?.[0];
          // example: var_name, var_name.sub_name, var_name[0]
          const varPath = execArr?.[1];
          const matchedVar = varPath ? get(process.env, varPath) : undefined;

          const replaceText = () => {
            const valuePrefix = value.substring(0, execArr!.index);
            const valueReplace = `${matchedVar}`;
            const valueSuffix = value.substring(execArr!.index + matchedStr!.length);
            return `${valuePrefix}${valueReplace}${valueSuffix}`;
          };
          return {
            isMatched,
            matchedStr,
            varPath,
            matchedVar,
            replaceText,
          };
        };

        const varHandler = (value: string) => {
          context.varReplaceRegex.lastIndex = 0;
          const execArr = context.varReplaceRegex.exec(value);

          const isMatched = isNotNil(execArr);
          // example: ${var_name}, ${var_name.sub_name}, ${var_name[0]}
          const matchedStr = execArr?.[0];
          // example: var_name, var_name.sub_name, var_name[0]
          const varPath = execArr?.[1];
          const matchedVar = varPath ? get(context.systemVars, varPath) || get(context.vars, varPath) : undefined;

          const replaceText = () => {
            const valuePrefix = value.substring(0, execArr!.index);
            const valueReplace = `${matchedVar}`;
            const valueSuffix = value.substring(execArr!.index + matchedStr!.length);
            return `${valuePrefix}${valueReplace}${valueSuffix}`;
          };
          return {
            isMatched,
            matchedStr,
            varPath,
            matchedVar,
            replaceText,
          };
        };

        const varHandlerResult = varHandler(valueOfKey);
        const envVarHandlerResult = envVarHandler(valueOfKey);

        if (varHandlerResult.isMatched) {
          logv(`Variable injection: '${key}'=>'${valueOfKey}'`);
          valueOfKey = varHandlerResult.replaceText();
        } else if (envVarHandlerResult.isMatched) {
          logv(`Variable injection: '${key}'=>'${valueOfKey}'`);
          valueOfKey = envVarHandlerResult.replaceText();
        } else {
          break;
        }
      }

      anyTypeTask[key] = valueOfKey;
    }
  }
};

export const searchExtraKeyValue = (
  extraArgs: string[],
  fmt: string,
  convertToCamelKeys: boolean,
  callback: (key: string, value: string) => void
) => {
  let currentVarName: string | undefined;
  let useNextElementAsVar: boolean = false;

  for (let extraArg of extraArgs) {
    const arg = extraArg.trim();
    if (arg === '--') {
      logv("Stop parsing by '--'");
      break;
    }

    if (useNextElementAsVar && currentVarName) {
      const value = extraArg.startsWith('-') ? '' : extraArg;
      callback(currentVarName, value);
      currentVarName = undefined;
      useNextElementAsVar = false;
    } else {
      const prefixIndex = extraArg.indexOf(fmt);
      if (prefixIndex >= 0) {
        const equalMarkIndex = extraArg.indexOf('=');
        if (equalMarkIndex >= 0) {
          const varName = convertOrNotHyphenTextToCamelText(
            extraArg.substring(fmt.length, equalMarkIndex),
            convertToCamelKeys
          );
          const value = extraArg.substring(equalMarkIndex + 1);
          callback(varName, value);
        } else {
          currentVarName = convertOrNotHyphenTextToCamelText(extraArg.substring(fmt.length), convertToCamelKeys);
          useNextElementAsVar = true;
        }
      }
    }
  }
};

export const setTaskVar = (context: TaskContext, key: string, value: any, skipForExists: boolean) => {
  if (skipForExists && context.vars[key] !== undefined) {
    logv(`Skips assigning the variable ${key}=${value} because it already exists.`);
    return;
  }

  logv(`Sets the variable ${key}=${value}`);
  context.vars[key] = value;
};

export const setEnvVar = (context: TaskContext, key: string, value: any, skipForExists: boolean) => {
  var valueType = typeof value;
  if (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean') {
    logv(`Ignoring the invalid typed(${valueType}) environment variable ${key}=${value}`);
  } else {
    const stringVal = String(value);
    if (stringVal.length < 1) {
      logv(`Ignoring the invalid environment variable ${key}=${value}`);
    } else {
      if (skipForExists && process.env[key] !== undefined) {
        logv(`Skips assigning the environment variable ${key}=${value} because it already exists.`);
        return;
      }

      logv(`Sets the environment variable ${key}=${value}`);
      process.env[key] = String(value);
    }
  }
};
