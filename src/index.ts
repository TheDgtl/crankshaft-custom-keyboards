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

export const load = async (smm: SMM) => {
  console.log('CCK::load');

  const keyboards = CustomKeyboards.getInstance(smm);
  const patchMethods = PatchMethods.getInstance(smm, keyboards, window.userProfileStore);

  // Load all of our keyboards
  keyboards.loadKeyboards().then(async () => {
    // Load our saved keyboard if one is set
    keyboards.setCustomKeyboard(await smm.Store.get(PLUGIN_ID, 'customKeyboard'));

    // Patch all of our userProfileStore methods
    patchMethods.patchUserProfileStore();

    console.info('CCK::Loaded');
  }).catch((err) => {
    console.log('CCK::Error loading keyboards: ', err);
  });
};

export const unload = (smm: SMM) => {
  console.log('CCK::unload');

  // Restore the original keyboard skin functions
  const keyboards = CustomKeyboards.getInstance(smm);
  const patchMethods = PatchMethods.getInstance(smm, keyboards, window.userProfileStore);
  patchMethods.unpatchUserProfileStore();

  // Clear any CSS we've injected
  document.getElementById('cck_style')?.remove();

  console.info('CCK::Unloaded');
};
