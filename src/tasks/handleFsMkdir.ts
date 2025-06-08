import { mkdirpSync } from 'fs-extra';
import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import { checkTypeOrThrow } from '@/utils';
import { z } from 'zod';

export const TaskFsMakeDirSchema = newTaskSchema('fs-mkdir', {
  path: z.string().nonempty(),
});
export type TaskFsMakeDir = z.infer<typeof TaskFsMakeDirSchema>;

export const handleMkdir = async (context: TaskContext, task: TaskFsMakeDir) => {
  checkTypeOrThrow('path', task.path, ['string']);
  logv(`Make a directory at : ${task.path}`);
  mkdirpSync(task.path);
};
