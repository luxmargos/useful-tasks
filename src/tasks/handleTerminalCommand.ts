import { execSync } from 'child_process';
import { logv } from '@/loggers';
import { TaskContext, TaskTerminalCommand } from '@/task_data';

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
