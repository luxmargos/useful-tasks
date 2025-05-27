import fs from 'fs';
import path from 'path';
import json5 from 'json5';
import { Task, type TasksScriptInput } from 'task_data';
import { logw, logv } from './loggers';
import { assignIn } from 'es-toolkit/compat';

export const loadFileOrThrow = (filePath: string) => {
  logv(`Loading file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`ERROR: The Path '${filePath}' does not exists!`);
  }

  return fs.readFileSync(filePath, { encoding: 'utf-8' });
};

export const loadJson = (filePath: string) => {
  return parseJson(loadFileOrThrow(filePath));
};

export const parseJson = (content: string) => json5.parse(content);

export const loadJsonConfig = (filePath: string): TasksScriptInput => {
  let configJson = loadJson(filePath);
  if (configJson.extends) {
    const filePathDir = path.dirname(filePath);
    const extendsFilePath = path.resolve(filePathDir, configJson.extends);
    configJson = assignIn({}, configJson, loadJsonConfig(extendsFilePath));
  }

  return configJson;
};

export const convertOrNotHyphenTextToCamelText = (text: string, flag: boolean) => {
  if (!flag) {
    return text;
  }

  let result = '';
  let textArr = text.split('-');
  for (let i = 0; i < textArr.length; i++) {
    let word = textArr[i];
    if (i === 0) {
      result = word;
    } else {
      if (word.length > 0) {
        word = `${word[0].toUpperCase()}${word.substring(1)}`;
      }
      result = `${result}${word}`;
    }
  }
  return result;
};

export const containsTag = (elements: string[], tags?: string[]) => {
  if (elements.length < 1) {
    return false;
  }

  for (const el of elements) {
    if (tags) {
      for (const tag of tags) {
        if (el === tag) {
          return true;
        }
      }
    }
  }

  return false;
};

export const containsAllTag = (elements: string[], tags?: string[]) => {
  if (elements.length < 1) {
    return false;
  }
  for (const el of elements) {
    let contained = false;
    if (tags) {
      for (const tag of tags) {
        if (tag === el) {
          contained = true;
          break;
        }
      }
    }

    if (!contained) {
      return false;
    }
  }
  return true;
};

export const checkEmptyStringOrThrow = (name: string, value: string) => {
  if (!value) {
    throw new Error(`The '${name}' property must not be empty.`);
  }
};

export const checkLegacyUsage = (task: Task, key: string) => {
  if ((task as any)[key] !== undefined) logw(`The key '${key}' has been deprecated.`);
};

type TypeString = 'string' | 'number' | 'boolean' | 'undefined' | 'object' | 'function' | 'bigint' | 'symbol';
export const checkType = (value: any, allowedTypes: TypeString[]): boolean => {
  if (allowedTypes.length <= 0) return true;
  return allowedTypes.includes(typeof value);
};

export const checkTypeOrThrow = (name: string, value: any, allowedTypes: TypeString[]): boolean => {
  if (checkType(value, allowedTypes)) {
    return true;
  }

  const valueType = typeof value;
  throw new Error(
    `The '${name}' property has an invalid type '${valueType}' with the value '${value}'. The allowed types are [${allowedTypes}].`
  );
};

const ENV_LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

/**  Parse src into an Object */
export function parseLines(src: string) {
  const obj: any = {};

  // Convert buffer to string
  let lines = src.toString();

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/gm, '\n');

  let match: RegExpExecArray | null;
  while ((match = ENV_LINE.exec(lines)) != null) {
    const key = match[1];
    // Default undefined or null to empty string
    let value = match[2] || '';
    // Remove whitespace
    value = value.trim();
    // Check if double quoted
    const maybeQuote = value[0];
    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');
    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    // Add to object
    obj[key] = value;
  }

  return obj;
}

export const throwInvalidParamError = <T, K extends keyof T>(obj: T, key: K) => {
  throw new Error(`The parameter '${String(key)}' has an invalid value ${obj[key]}`);
};

export const resolveStringArray = (val: string | string[] | undefined | null, defaultValue: string[]): string[] => {
  if (val !== undefined && val !== null) {
    if (typeof val === 'string') {
      return [val];
    } else if (Array.isArray(val)) {
      return val.filter((v) => typeof v === 'string');
    }
  }

  return defaultValue;
};
