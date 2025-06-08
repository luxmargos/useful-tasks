import { execSync } from 'child_process';
import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import { z } from 'zod';

export const TaskTerminalCommandSchema = newTaskSchema('cmd', { cmd: z.string(), shell: z.string().optional() });
export type TaskTerminalCommand = z.infer<typeof TaskTerminalCommandSchema>;

export const handleTerminalCommand = async (context: TaskContext, task: TaskTerminalCommand) => {
  logv(`Start execution... ${task.cmd}`);
  execSync(task.cmd, {
    shell: task.shell,
    // cwd: cwd,
    env: process.env,
    stdio: [process.stdin, process.stdout, process.stderr],
    encoding: 'utf-8',
  });
};
