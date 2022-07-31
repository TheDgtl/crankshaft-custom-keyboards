/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '../types/smm';
import { CustomKeyboards } from './customkeyboards';
import { PatchMethods } from './patchmethods';

export const PLUGIN_ID = 'crankshaft-custom-keyboards';

let patchMethods: PatchMethods;
let keyboards: CustomKeyboards;

export const load = async (smm: SMM) => {
  console.log('CCK::load');

  keyboards = new CustomKeyboards(smm);
  patchMethods = new PatchMethods(smm, keyboards, window.userProfileStore);

  // Load all of our keyboards
  keyboards.loadKeyboards().then(async () => {
    // Load our saved keyboard if one is set
    keyboards.setCustomKeyboard(await smm.Store.get(PLUGIN_ID, 'customKeyboard'));

    // Patch all of our userProfileStore methods
    patchMethods.patchUserProfileStore();

    console.info('CCK::Loaded');
  });
};

export const unload = () => {
  console.log('CCK::unload');

  // Restore the original keyboard skin functions
  if (patchMethods) {
    patchMethods.unpatchUserProfileStore();
  }

  // Clear any CSS we've injected
  document.getElementById('cck_style')?.remove();

  console.info('CCK::Unloaded');
};
