import { mkdirpSync } from 'fs-extra';
import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import { checkTypeOrThrow } from '@/utils';
import { z } from 'zod';

export const TaskFsMakeDirSchema = newTaskSchema('fs-mkdir', {
  path: z.union([z.string().nonempty(), z.array(z.string().nonempty())]),
}).transform((data) => {
  return {
    ...data,
    path: typeof data.path === 'string' ? [data.path] : data.path,
  };
});
export type TaskFsMakeDir = z.infer<typeof TaskFsMakeDirSchema>;

export const handleMkdir = async (context: TaskContext, task: TaskFsMakeDir) => {
  for (const p of task.path) {
    logv(`Make a directory at : ${p}`);
    mkdirpSync(p);
  }
};
