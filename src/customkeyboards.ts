/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '../types/smm';
import { FileUtils } from './fileutils';

export type KeyboardEntry = {
  name: string;
  class: string;
  cssPath: string;
};

export class CustomKeyboards {
  private smm: SMM;
  private keyboardEntries: KeyboardEntry[] = [];
  private customKeyboard: string | undefined = undefined;
  private static instance: CustomKeyboards;

  // We use a singleton instance, because my vars in index.ts were being blown away on reload
  static getInstance(smm: SMM) {
    if (!this.instance) {
      this.instance = new CustomKeyboards(smm);
    }

    return this.instance;
  }

  constructor(smm: SMM) {
    console.log('CCK::CustomKeyboards::constructor');
    this.smm = smm;
  }

  setCustomKeyboard = (keyboard: string | undefined) => {
    this.customKeyboard = keyboard;
  };

  getCustomKeyboard = () => {
    return this.customKeyboard || '';
  };

  getKeyboardEntries = () => {
    return this.keyboardEntries;
  };

  loadKeyboards = (): Promise<void> => {
    console.log('CCK::CustomKeyboards::loadKeyboards');

    return new Promise<void>(async (resolve, reject) => {
      FileUtils.listDir(this.smm, '~/homebrew/keyboards/').then(async (keyboardDirList) => {
        for (const dirEntry of keyboardDirList) {
          if (!dirEntry.isDir) continue;
          await this.loadKeyboard(dirEntry.name);
        }

        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  };

  private loadKeyboard = async (name: string): Promise<void> => {
    console.log(`CCK::CustomKeyboards::loadKeyboard(${name})`);

    return new Promise<void>(async (resolve) => {
      const keyboardPath = '~/homebrew/keyboards/' + name;
      FileUtils.readFile(this.smm, keyboardPath + '/keyboard.json').then((keyboardJson) => {
        const keyboard = JSON.parse(keyboardJson);
        if (keyboard['name'] && keyboard['class']) {
          console.log('CCK::Loadkeyboard Loaded ', keyboard['class']);
          this.keyboardEntries.push({
            name: keyboard['name'],
            class: keyboard['class'],
            cssPath: keyboardPath + '/keyboard.css',
          });
        }
        resolve();
      }).catch((err) => {
        console.log('CCK::Error loading keyboard: ', err);
        resolve();
      });
    });
  };
}
