import { mkdirpSync } from 'fs-extra';
import { logv } from '@/loggers';
import { TaskContext, TaskFsMakeDir } from '@/task_data';
import { checkTypeOrThrow } from '@/utils';

export const handleMkdir = async (context: TaskContext, task: TaskFsMakeDir) => {
  checkTypeOrThrow('path', task.path, ['string']);
  logv(`Make a directory at : ${task.path}`);
  mkdirpSync(task.path);
};
