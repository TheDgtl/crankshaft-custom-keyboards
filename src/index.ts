/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '@crankshaft/types';
import { CustomKeyboards } from './customkeyboards';
import { PatchMethods } from './patchmethods';
import { SettingsObserver } from './settingsobserver';

export const PLUGIN_ID = 'crankshaft-custom-keyboards';

export const load = async (smm: SMM) => {
  console.info('CCK::load');

  const keyboards = CustomKeyboards.getInstance(smm);
  const patchMethods = PatchMethods.getInstance(smm, keyboards, window.userProfileStore);
  const settingsObserver = SettingsObserver.getInstance(smm);

  // Attach our settings observer
  const boundReloadKeyboards = reloadKeyboards.bind(null, smm, keyboards, patchMethods);
  settingsObserver.attachObserver(boundReloadKeyboards);

  // Patch the userProfileStore keyboard methods
  patchMethods.patchUserProfileStore();

  // Load our keyboards
  await reloadKeyboards(smm, keyboards, patchMethods);

  console.info('CCK::Loaded');
};

export const unload = (smm: SMM) => {
  console.info('CCK::unload');

  // Remove our settings observer
  const settingsObserver = SettingsObserver.getInstance(smm);
  settingsObserver.detachObserver();

  // Restore the original keyboard skin functions
  const keyboards = CustomKeyboards.getInstance(smm);
  const patchMethods = PatchMethods.getInstance(smm, keyboards, window.userProfileStore);
  patchMethods.unpatchUserProfileStore();

  // Clear any CSS we've injected
  document.getElementById('cck_style')?.remove();

  console.info('CCK::Unloaded');
};

const reloadKeyboards = (smm: SMM, keyboards: CustomKeyboards, patchMethods: PatchMethods): Promise<void> => {
  return new Promise<void>((resolve) => {
    // Load all of our keyboards
    keyboards.loadKeyboards().then(async () => {
      // Load our saved keyboard if one is set
      keyboards.setCustomKeyboard(await smm.Store.get(PLUGIN_ID, 'customKeyboard'));

      resolve();
    }).catch((err) => {
      console.error('CCK::Error loading keyboards: ', err);
      resolve();
    }).finally(() => {
      // Refresh the keyboard UI
      patchMethods.refreshKeyboards();
    });
  });
}
