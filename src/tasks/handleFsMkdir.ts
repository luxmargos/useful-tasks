import { mkdirpSync } from 'fs-extra';
import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import { z } from 'zod';

export const TaskFsMakeDirSchema = newTaskSchema('fs-mkdir', {
  path: z.union([z.string().nonempty(), z.array(z.string().nonempty())]),
});
export type TaskFsMakeDir = z.infer<typeof TaskFsMakeDirSchema>;

export const handleMkdir = async (context: TaskContext, task: TaskFsMakeDir) => {
  const pathItems = typeof task.path === 'string' ? [task.path] : task.path;
  for (const p of pathItems) {
    logv(`Make a directory at : ${p}`);
    mkdirpSync(p);
  }
};
