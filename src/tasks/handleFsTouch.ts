import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import fse from 'fs-extra';
import { z } from 'zod';

export const TaskFsTouchSchema = newTaskSchema('fs-touch', {
  path: z.string().nonempty(),
});
export type TaskFsTouch = z.infer<typeof TaskFsTouchSchema>;

export const handleFsTouch = async (context: TaskContext, task: TaskFsTouch) => {
  logv(`Touch a file at : ${task.path}`);
  if (fse.existsSync(task.path)) return;
  fse.writeFileSync(task.path, '');
};
