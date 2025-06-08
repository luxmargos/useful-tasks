import fs from 'fs';
import { mkdirpSync } from 'fs-extra';
import path from 'path';
import { newTaskSchema, TaskContext } from '@/task_data';
import { z } from 'zod';

export const TaskOutputTargetsSchema = z.union([
  z.literal('console').describe('Output to console'),
  z.literal('file-write').describe('Output to file (overwriting)'),
  z.literal('file-append').describe('Output to file (appending)'),
  z.literal('c').describe('Output to console'),
  z.literal('fw').describe('Output to file (overwriting)'),
  z.literal('fa').describe('Output to file (appending)'),
]);

export type TaskOutputTargets = z.infer<typeof TaskOutputTargetsSchema>;

export const TaskOutputSchema = newTaskSchema('output', {
  target: TaskOutputTargetsSchema,
  text: z.string(),
  path: z.string().nonempty().optional(),
});
export type TaskOutput = z.infer<typeof TaskOutputSchema>;

export const handleOutput = async (context: TaskContext, task: TaskOutput) => {
  const text = task.text ?? '';
  const target: TaskOutputTargets = (task.target ?? 'c').trim() as TaskOutputTargets;
  const targetPath = task.path;

  if (target === 'c' || target === 'console') {
    console.log(text);
  } else {
    if (!targetPath) {
      throw new Error(`The parameter 'path' is required for a target '${target}'!`);
    }

    const resolvedPath = path.resolve(targetPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      mkdirpSync(dir);
    }

    if (target == 'fa' || target == 'file-append') {
      let err;
      let fd;
      try {
        fd = fs.openSync(resolvedPath, 'a');
        fs.appendFileSync(fd, text, 'utf8');
      } catch (e) {
        err = e;
      } finally {
        if (fd !== undefined) {
          fs.closeSync(fd);
        }
      }

      if (err) {
        throw err;
      }
    } else {
      fs.writeFileSync(resolvedPath, text);
    }
  }
};
