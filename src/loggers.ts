import debug from 'debug';

const LogLevelInfo = 'info';
const LogLevelDebug = 'debug';
const LogLevelNone = 'none';
export const logLevels = [LogLevelNone, LogLevelInfo, LogLevelDebug] as const;
type LogLevelTuple = typeof logLevels;
export type LogLevel = LogLevelTuple[number];

export const LOG_TAG = 'useful-tasks';

export const TAG_DEBUG = `${LOG_TAG}:debug`;
export const TAG_INFO = `${LOG_TAG}:info`;
export const TAG_WARN = `${LOG_TAG}:warn`;

export const logw = debug(TAG_WARN);
export const logi = debug(TAG_INFO);
export const logv = debug(TAG_DEBUG);
