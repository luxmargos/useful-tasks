import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import fse from 'fs-extra';
import { z } from 'zod';

export const TaskFsTouchSchema = newTaskSchema('fs-touch', {
  path: z.union([z.string().nonempty(), z.array(z.string().nonempty())]),
}).transform((data) => {
  return {
    ...data,
    path: typeof data.path === 'string' ? [data.path] : data.path,
  };
});
export type TaskFsTouch = z.infer<typeof TaskFsTouchSchema>;

export const handleFsTouch = async (context: TaskContext, task: TaskFsTouch) => {
  for (const p of task.path) {
    if (fse.existsSync(p)) continue;
    logv(`Touch a file at : ${p}`);
    fse.writeFileSync(p, '');
  }
};
