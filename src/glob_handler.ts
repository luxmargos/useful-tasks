import fs from 'fs';
import { globSync } from 'glob';

/**
 * Processes files or directories based on glob patterns.
 *
 * @param handler - The function to handle each file or directory.
 * @param cwd - The current working directory.
 * @param includes - The include patterns.
 * @param excludes - The exclude patterns.
 * @param skipDirs - Whether to skip directories.
 * @param includeAllIfNonFilters - Whether to include all files if no filters are specified.
 * @returns A promise that resolves to a boolean indicating whether any files were processed.
 */
export const processWithGlobSync = async (
  handler: (items: string[]) => Promise<void> | void,
  cwd: string,
  includes: string[],
  excludes: string[],
  skipDirs: boolean,
  includeAllIfNonFilters: boolean
): Promise<boolean> => {
  if (fs.statSync(cwd).isDirectory() === false) {
    return false;
  }

  //pre apply filter for faster performance
  const nodir: boolean = skipDirs === true;

  const hasIncludes: boolean = includes.length > 0;
  const hasExcludes: boolean = excludes.length > 0;
  if (!hasIncludes && hasExcludes) {
    //include all to apply excludes
    await handler(globSync(['**'], { ignore: [...excludes], cwd, nodir }).filter((item) => item !== '.'));
    return true;
  } else if (hasIncludes && !hasExcludes) {
    //apply includes only
    await handler(globSync(includes, { cwd, nodir }));
    return true;
  } else if (hasIncludes && hasExcludes) {
    //apply include and exclude
    await handler(globSync(includes, { ignore: excludes, cwd, nodir }));
    return true;
  } else if (includeAllIfNonFilters) {
    // handle for !hasIncludes && !hasExcludes
    // include all to apply skipDirs, skipFiles
    await handler(globSync(['**'], { cwd, nodir }).filter((item) => item !== '.'));
    return true;
  }

  // handle for !hasIncludes && !hasExcludes && !includeAllIfNonFilters
  return false;
};
