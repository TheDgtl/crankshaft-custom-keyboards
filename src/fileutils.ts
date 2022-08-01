/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '../types/smm';

export type DirEntry = {
  name: string;
  isDir: boolean;
};

export class FileUtils {
  // Forgive me for this abomination, but we need to break out of the sandbox,
  // and still get whether it's a directory
  static listDir = async (smm: SMM, path: string): Promise<DirEntry[]> => {
    return new Promise<DirEntry[]>(async (resolve, reject) => {
      let dirEntries: DirEntry[] = [];

      const result = await smm.Exec.run('bash', ['-c', `ls -1 "${path}"`]);

      if (result.exitCode !== 0) {
        reject(result.stderr);
        return;
      }

      const dirList = result.stdout.split(/\r?\n/);
      for (const name of dirList) {
        const isDir = await smm.Exec.run('bash', ['-c', '[ -d "${path}/${name}" ] && echo 1 || echo 0']);
        dirEntries.push({
          name: name,
          isDir: isDir.stdout === '1',
        });
      }

      resolve(dirEntries);
    });
  };

  static readFile = async (smm: SMM, path: string): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      const result = await smm.Exec.run('bash', ['-c', `cat "${path}"`]);

      if (result.exitCode === 0) {
        resolve(result.stdout);
      } else {
        reject(result.stderr);
      }
    });
  };
}
