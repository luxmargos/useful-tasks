import fs from "fs";
import { mkdirpSync } from "fs-extra";
import path from "path";
import { TaskContext, TaskOutput, TaskOutputTargets } from "task_data";

export const handleOutput = async (context: TaskContext, task: TaskOutput) => {
  const text = task.text ?? "";
  const target: TaskOutputTargets = (task.target ?? "c").trim() as TaskOutputTargets;
  const targetPath = task.path;

  if (target === "c" || target === "console") {
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

    if (target == "fa" || target == "file-append") {
      let err;
      let fd;
      try {
        fd = fs.openSync(resolvedPath, "a");
        fs.appendFileSync(fd, text, "utf8");
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
