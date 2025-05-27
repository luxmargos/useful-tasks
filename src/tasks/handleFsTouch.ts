import { logv } from '@/loggers';
import { TaskContext, TaskFsTouch } from '@/task_data';
import fse from 'fs-extra';

export const handleFsTouch = async (context: TaskContext, task: TaskFsTouch) => {
  logv(`Touch a file at : ${task.path}`);
  if (fse.existsSync(task.path)) return;
  fse.writeFileSync(task.path, '');
};
