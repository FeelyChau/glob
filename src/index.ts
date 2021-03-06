import { existsSync, readdirSync, statSync } from 'fs';
import { resolve } from 'path';
import * as pm from 'picomatch';
import { debuglog } from 'util';

const log = debuglog('midway:glob');

export interface RunOptions {
  cwd: string;
  ignore?: string[];
}

export const run = (pattern: string[], options: RunOptions = { cwd: process.cwd(), ignore: [] }) => {
  const startTime = Date.now();
  const entryDir = options.cwd;
  const isMatch = pm(pattern, {
    ignore: options.ignore || []
  });
  const ignoreMatch = pm('**', {
    ignore: options.ignore || []
  })
  const result = globDirectory(entryDir, isMatch, ignoreMatch, options);
  log(`midway glob timing ${Date.now() - startTime}ms`);
  return result;
}

const globDirectory = (dirname: string, isMatch, ignoreDirMatch, options?) => {
  if (!existsSync(dirname)) {
    return [];
  }
  const list = readdirSync(dirname);
  const result = [];

  for( let file of list) {
    const resolvePath = resolve(dirname, file);
    const fileStat = statSync(resolvePath);
    if (fileStat.isDirectory() && ignoreDirMatch(resolvePath.replace(dirname, ''))) {
      const childs = globDirectory(resolvePath, isMatch, ignoreDirMatch, options);
      result.push(...childs);
    } else if(fileStat.isFile() && isMatch(resolvePath.replace(dirname, ''))) {
      result.push(resolvePath);
    }
  }

  return result;
};