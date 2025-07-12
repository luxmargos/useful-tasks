import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import fse from 'fs-extra';
import { z } from 'zod';

export const TaskFsTouchSchema = newTaskSchema('fs-touch', {
  path: z.union([z.string().nonempty(), z.array(z.string().nonempty())]),
});
export type TaskFsTouch = z.infer<typeof TaskFsTouchSchema>;

export const handleFsTouch = async (context: TaskContext, task: TaskFsTouch) => {
  const pathItems = typeof task.path === 'string' ? [task.path] : task.path;
  for (const p of pathItems) {
    if (fse.existsSync(p)) continue;
    logv(`Touch a file at : ${p}`);
    fse.writeFileSync(p, '');
  }
};
