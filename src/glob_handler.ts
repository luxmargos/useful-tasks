import fs from 'fs';
import { globSync } from 'glob';

/**
 *
 * @param handler
 * @param cwd
 * @param includes
 * @param excludes
 * @param includeAllForNonFilter
 * @param subOptions
 * @returns true - filters are applied, false - there was no filter to apply
 */
export const processWithGlobSync = (
  handler: (items: string[]) => void,
  cwd: string,
  includes: string[],
  excludes: string[],
  skipDirs: boolean,
  includeAllIfNonFilters: boolean
): boolean => {
  if (fs.statSync(cwd).isDirectory() === false) {
    return false;
  }

  //pre apply filter for faster performance
  const nodir: boolean = skipDirs === true;

  const hasIncludes: boolean = includes.length > 0;
  const hasExcludes: boolean = excludes.length > 0;
  if (!hasIncludes && hasExcludes) {
    //include all to apply excludes
    handler(globSync(['**'], { ignore: [...excludes], cwd, nodir }).filter((item) => item !== '.'));
    return true;
  } else if (hasIncludes && !hasExcludes) {
    //apply includes only
    handler(globSync(includes, { cwd, nodir }));
    return true;
  } else if (hasIncludes && hasExcludes) {
    //apply include and exclude
    handler(globSync(includes, { ignore: excludes, cwd, nodir }));
    return true;
  } else if (includeAllIfNonFilters) {
    //include all to apply skipDirs, skipFiles
    handler(globSync(['**'], { cwd, nodir }).filter((item) => item !== '.'));
    return true;
  }

  return false;
};
