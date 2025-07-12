import { isNil } from 'es-toolkit';
import { logv } from './loggers';
import { TaskContext } from './task_data';
import { convertOrNotHyphenTextToCamelText } from './utils';

export const replaceVarLiterals = async (
  depth: number,
  providers: { regex: RegExp; store: (varPath: string) => any }[],
  anyValue: any,
  canBeChanged: (obj: any, depth: number, key: any, valueOfKey: any) => boolean,
  onChange: (obj: any, depth: number, key: any, valueOfKey: string) => void
) => {
  if (typeof anyValue !== 'object' && !Array.isArray(anyValue)) {
    return false;
  }

  let hasChanges = false;
  for (const key of Object.keys(anyValue)) {
    if (!canBeChanged(anyValue, depth, key, anyValue[key])) {
      continue;
    }
    const valueOfKey = anyValue[key];

    // for set var and env var strings
    if (valueOfKey !== undefined && typeof valueOfKey === 'string') {
      const result = await replaceVarLiteralsForText(
        providers,
        valueOfKey,
        (valueOfKey) => {},
        (valueOfKey) => {
          onChange(anyValue, depth, key, valueOfKey);
        }
      );
      if (result.hasChanges) {
        hasChanges = true;
      }
    }
    //for set var objects
    else if (typeof valueOfKey === 'object' || Array.isArray(valueOfKey)) {
      if (await replaceVarLiterals(depth + 1, providers, valueOfKey, canBeChanged, onChange)) {
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      onChange(anyValue, depth, key, valueOfKey);
    }
  }

  return hasChanges;
};

export const replaceVarLiteralsForText = async (
  providers: { regex: RegExp; store: (varPath: string) => any }[],
  valueOfKey: string,
  beforeChange?: (valueOfKey: string) => void,
  afterChange?: (valueOfKey: string) => void
) => {
  let hasChanges = false;
  // NOTE: Consider to remove this check
  // if (typeof key !== 'string') {
  //   continue;
  // }

  let hasChangesForCurrentKey = false;
  while (true) {
    const varLiteralHandler = (value: string) => {
      let isMatched = false;
      let canReplace = false;
      let matchedStr: string | undefined;
      let varPath: string | undefined;
      let matchedVar: string | undefined;
      let replaceText = () => value;
      for (const provider of providers) {
        const regex = provider.regex;
        regex.lastIndex = 0;
        const execArr = regex.exec(value);
        if (!isNil(execArr)) {
          isMatched = true;
          // example: Text ${var_name}, Text ${var_name.sub_name}, Text ${var_name[0]}
          matchedStr = execArr[0];
          // example: ${var_name}, ${var_name.sub_name}, ${var_name[0]}
          varPath = execArr[1];
          matchedVar = varPath ? provider.store(varPath) : undefined;
          canReplace = !isNil(matchedVar);
          replaceText = () => {
            const valuePrefix = value.substring(0, execArr.index);
            const valueReplace = `${matchedVar}`;
            const valueSuffix = value.substring(execArr.index + matchedStr!.length);
            return `${valuePrefix}${valueReplace}${valueSuffix}`;
          };
          if (canReplace) {
            break;
          }
        }
      }

      return {
        isMatched,
        canReplace,
        matchedStr,
        varPath,
        matchedVar,
        replaceText,
      };
    };

    const varLiteralHandlerResult = varLiteralHandler(valueOfKey);

    if (varLiteralHandlerResult.canReplace) {
      logv(`Injecting the variable literal: '${valueOfKey}'`);
      beforeChange?.(valueOfKey);
      valueOfKey = varLiteralHandlerResult.replaceText();
      afterChange?.(valueOfKey);
      logv(`Injected the variable literal: '${valueOfKey}'`);
      hasChanges = true;
      hasChangesForCurrentKey = true;
    } else {
      break;
    }
  }

  return { hasChanges, valueOfKey };
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
    if (skipForExists && process.env[key] !== undefined) {
      logv(`Skips assigning the environment variable ${key}=${value} because it already exists.`);
      return;
    }

    logv(`Sets the environment variable ${key}=${value}`);
    process.env[key] = stringVal;
  }
};
