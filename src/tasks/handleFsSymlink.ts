import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { logv } from '@/loggers';
import { newTaskSchema, TaskContext } from '@/task_data';
import { z } from 'zod';

export const TaskSymlinkSchema = newTaskSchema('fs-symlink', {
  type: z.literal('fs-symlink'),
  target: z.string().nonempty(),
  path: z.string().nonempty(),
  linkType: z
    .union([z.literal('dir'), z.literal('file'), z.literal('junction')])
    .optional()
    .describe('Link type, dir for directory, file for file, junction for Windows junction'),
  forced: z.boolean().optional().describe('If true, will remove existing files/links at path'),
});

export type TaskSymlink = z.infer<typeof TaskSymlinkSchema>;

export const handleFsSymlink = async (context: TaskContext, task: TaskSymlink) => {
  const target: string = path.resolve(task.target);
  const dstPath: string = path.resolve(task.path);

  if (fs.existsSync(dstPath)) {
    const lstat: fs.Stats = fs.lstatSync(dstPath);
    logv(`LSTAT is symlink? ${lstat.isSymbolicLink()}, is directory? ${lstat.isDirectory()}`);
    if (task.forced) {
      if (lstat.isSymbolicLink() || lstat.isFile()) {
        logv(`Unlink ${dstPath}`);
        fs.unlinkSync(dstPath);
      } else if (lstat.isDirectory()) {
        logv(`Remove directory '${dstPath}'`);
        fse.removeSync(dstPath);
      }
    }
  }

  if (fs.existsSync(dstPath)) {
    logv(`Could not create symbolic link cause '${dstPath}' already exists`);
    // throw Error()
  } else {
    logv(`Create symbolic link ${target} => ${dstPath}`);
    fs.symlinkSync(target, dstPath, task.linkType);
    const lstat: fs.Stats = fs.lstatSync(dstPath);
    logv(`LSTAT is symlink? ${lstat.isSymbolicLink()}, is directory? ${lstat.isDirectory()}`);
  }
};
