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

    return new Promise<void>(async (resolve) => {
      const keyboardDirList = await FileUtils.listDir(this.smm, '~/homebrew/keyboards/');

      for (const dirEntry of keyboardDirList) {
        if (!dirEntry.isDir) continue;
        await this.loadKeyboard(dirEntry.name);
      }

      resolve();
    });
  };

  private loadKeyboard = async (name: string) => {
    console.log(`CCK::CustomKeyboards::loadKeyboard(${name})`);

    const keyboardPath = '~/homebrew/keyboards/' + name;
    const keyboardJson = await FileUtils.readFile(this.smm, keyboardPath + '/keyboard.json');
    const keyboard = JSON.parse(keyboardJson);
    if (keyboard['name'] && keyboard['class']) {
      this.keyboardEntries.push({
        name: keyboard['name'],
        class: keyboard['class'],
        cssPath: keyboardPath + '/keyboard.css',
      });
    }
  };
}
