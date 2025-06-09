import { logv } from './loggers';
import { TaskContext } from './task_data';
import { convertOrNotHyphenTextToCamelText } from './utils';
import { isNotNil } from 'es-toolkit/compat';

export const replaceVarLiterals = async (
  providers: { regex: RegExp; store: (varPath: string) => any }[],
  anyValue: any,
  immutableValueOfKeys: string[] = [],
  inheritValueOfKeys: boolean = false
) => {
  if (typeof anyValue !== 'object' && !Array.isArray(anyValue)) {
    return false;
  }

  let hasChanges = false;
  for (const key of Object.keys(anyValue)) {
    // NOTE: Consider to remove this check
    // if (typeof key !== 'string') {
    //   continue;
    // }

    if (immutableValueOfKeys.includes(key)) {
      continue;
    }

    let valueOfKey: string = anyValue[key];
    if (valueOfKey !== undefined && typeof valueOfKey === 'string') {
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
            if (isNotNil(execArr)) {
              isMatched = true;
              // example: Text ${var_name}, Text ${var_name.sub_name}, Text ${var_name[0]}
              matchedStr = execArr[0];
              // example: ${var_name}, ${var_name.sub_name}, ${var_name[0]}
              varPath = execArr[1];
              matchedVar = varPath ? provider.store(varPath) : undefined;
              canReplace = isNotNil(matchedVar);
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
          logv(`Injecting the variable literal: '${key}'=>'${valueOfKey}'`);
          valueOfKey = varLiteralHandlerResult.replaceText();
          hasChanges = true;
          hasChangesForCurrentKey = true;
        } else {
          break;
        }
      }

      if (hasChangesForCurrentKey) {
        anyValue[key] = valueOfKey;
      }
    } else if (typeof valueOfKey === 'object' || Array.isArray(valueOfKey)) {
      if (inheritValueOfKeys) {
        if (await replaceVarLiterals(providers, valueOfKey, immutableValueOfKeys, true)) {
          hasChanges = true;
        }
      } else {
        if (await replaceVarLiterals(providers, valueOfKey, [], false)) {
          hasChanges = true;
        }
      }
    }
  }

  return hasChanges;
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
