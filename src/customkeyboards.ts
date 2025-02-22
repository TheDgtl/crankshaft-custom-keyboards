/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '@crankshaft/types';
import { FileUtils } from './fileutils';

export type KeyboardEntry = {
  name: string;
  class: string;
  cssPath: string;
};

export const baseKeyboardSkins: any = {
  "0": "DefaultTheme",
  "21194357487": "NightShift",
  "21194357488": "Candy",
  "21194357489": "SteamGreen",
  "21194357490": "DEX",
  "21406307404": "Digital",
  "21406309993": "Cerulean",
  "21696697703": "Pumpkin",
  "21696697692": "Grape",
  "21696697700": "Seafoam",
  "21696697696": "Ruby",
  "21696697687": "Spectrum",
  "21696697689": "TotallyTubular",

  // Unreleased
  "Lounger": "Lounger",
  "TwoTone": "TwoTone",
  "Celebration": "Celebration",
  "TestChamber": "TestChamber"
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
    console.debug('CCK::CustomKeyboards::constructor');
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
    console.debug('CCK::CustomKeyboards::loadKeyboards');
    
    this.keyboardEntries = [];

    return new Promise<void>(async (resolve, reject) => {
      FileUtils.listDir(this.smm, '$HOME/homebrew/keyboards/').then(async (keyboardDirList) => {
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
    console.debug(`CCK::CustomKeyboards::loadKeyboard(${name})`);

    return new Promise<void>(async (resolve) => {
      const keyboardPath = '$HOME/homebrew/keyboards/' + name;
      FileUtils.readFile(this.smm, keyboardPath + '/keyboard.json').then((keyboardJson) => {
        const keyboard = JSON.parse(keyboardJson);
        if (keyboard['name'] && keyboard['class']) {
          console.debug('CCK::Loadkeyboard Loaded ', keyboard['class']);
          this.keyboardEntries.push({
            name: keyboard['name'],
            class: keyboard['class'],
            cssPath: keyboardPath + '/keyboard.css',
          });
        }
        resolve();
      }).catch((err) => {
        console.error('CCK::Error loading keyboard: ', err);
        resolve();
      });
    });
  };
}
