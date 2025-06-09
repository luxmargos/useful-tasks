import { execSync } from 'child_process';
import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import { z } from 'zod';

export const TaskTerminalCommandSchema = newTaskSchema('cmd', {
  cmd: z.union([z.string(), z.array(z.string())]),
  shell: z.string().optional(),
}).transform((data) => {
  return {
    ...data,
    cmd: typeof data.cmd === 'string' ? [data.cmd] : data.cmd,
  };
});
export type TaskTerminalCommand = z.infer<typeof TaskTerminalCommandSchema>;

export const handleTerminalCommand = async (context: TaskContext, task: TaskTerminalCommand) => {
  logv(`Start execution... ${task.cmd}`);

  for (const cmd of task.cmd) {
    execSync(cmd, {
      shell: task.shell,
      env: process.env,
      stdio: [process.stdin, process.stdout, process.stderr],
      encoding: 'utf-8',
    });
  }
};
