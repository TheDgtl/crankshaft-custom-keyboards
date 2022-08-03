/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '@crankshaft/types';
import { CustomKeyboards, baseKeyboardSkins } from './customkeyboards';
import { FileUtils } from './fileutils';
import { PLUGIN_ID } from './index';

export class PatchMethods {
  private smm: SMM;
  private keyboards: CustomKeyboards;
  private static instance: PatchMethods;

  userProfileStore: typeof window.userProfileStore;
  
  // We use a singleton instance, because my vars in index.ts were being blown away on reload
  static getInstance(smm: SMM, keyboards: CustomKeyboards, userProfileStore: typeof window.userProfileStore) {
    if (!this.instance) {
      this.instance = new PatchMethods(smm, keyboards, userProfileStore);
    }

    return this.instance;
  }

  constructor(smm: SMM, keyboards: CustomKeyboards, userProfileStore: typeof window.userProfileStore) {
    console.log('CCK::PatchMethods::constructor');

    this.smm = smm;
    this.keyboards = keyboards;
    this.userProfileStore = userProfileStore;

    // Store original copies of the keyboard skin functions, if they aren't already stored
    // Note: We store these in the userProfileStore object, in case our plugin gets loaded twice
    if (!userProfileStore._GetKeyboardSkins) {
      userProfileStore._GetKeyboardSkins = userProfileStore.GetKeyboardSkins;
      userProfileStore._EquipKeyboardSkin = userProfileStore.EquipKeyboardSkin;
      userProfileStore._GetKeyboardSkinTheme = userProfileStore.GetKeyboardSkinTheme;
      userProfileStore._ForceRefreshEquippedItems = userProfileStore.ForceRefreshEquippedItems;
    }
  }

  patchUserProfileStore() {
    console.log('CCK::PatchMethods::patchUserProfileStore');

    // Override the keyboard skin functions with our own
    this.userProfileStore.GetKeyboardSkins = this.CustomGetKeyboardSkins;
    this.userProfileStore.EquipKeyboardSkin = this.CustomEquipKeyboardSkin;
    this.userProfileStore.GetKeyboardSkinTheme = this.CustomGetKeyboardSkinTheme;
    this.userProfileStore.ForceRefreshEquippedItems = this.CustomForceRefreshEquippedItems;
  }

  unpatchUserProfileStore() {
    console.log('CCK::PatchMethods::unpatchUserProfileStore');

    // Restore the original keyboard skin functions
    if (this.userProfileStore._GetKeyboardSkins) {
      this.userProfileStore.GetKeyboardSkins = this.userProfileStore._GetKeyboardSkins;
      this.userProfileStore.EquipKeyboardSkin = this.userProfileStore._EquipKeyboardSkin;
      this.userProfileStore.GetKeyboardSkinTheme = this.userProfileStore._GetKeyboardSkinTheme;
      this.userProfileStore.ForceRefreshEquippedItems = this.userProfileStore._ForceRefreshEquippedItems;
    }

    // Force a refresh of the keyboards
    this.userProfileStore.m_keyboardSkins = undefined;
    this.userProfileStore._ForceRefreshEquippedItems.call(this.userProfileStore);
  }

  refreshKeyboards = () => {
    // Force a refresh of the keyboard list in Settings
    this.userProfileStore.m_keyboardSkins = undefined;

    // If we have an equipped keyboard, force an item refresh and equip it
    if (this.keyboards.getCustomKeyboard()) {
      this.userProfileStore.ForceRefreshEquippedItems();
      this.userProfileStore.EquipKeyboardSkin(this.keyboards.getCustomKeyboard());
    }
  }

  CustomGetKeyboardSkins = () => {
    console.log('CCK::PatchMethods::CustomGetKeyboardSkins');

    // Re-implement the original GetKeyboardSkins, but inject our skins into the list after fetching
    // the owned profile items
    if (!this.userProfileStore.m_keyboardSkins) {
      this.userProfileStore.m_keyboardSkins = [];
      this.userProfileStore.GetProfileItemsOwned([16]).then((profileItems) => {
        if (profileItems) {
          var keyboardSkins = profileItems.steam_deck_keyboard_skins;
          this.keyboards.getKeyboardEntries().forEach((keyboard) => {
            keyboardSkins.push({
              communityitemid: 'cck_' + keyboard.class,
              item_title: keyboard.name,
            });
          });

          this.userProfileStore.m_keyboardSkins = keyboardSkins;
          this.userProfileStore.m_localStorage.StoreObject('GetKeyboardSkins', this.userProfileStore.m_keyboardSkins);
        } else {
          this.userProfileStore.m_localStorage.GetObject('GetKeyboardSkins').then((e) => {
            this.userProfileStore.m_keyboardSkins = e;
          });
        }
      });
    }
    return this.userProfileStore.m_keyboardSkins;
  };

  CustomEquipKeyboardSkin = (skinId: string): Promise<boolean> => {
    console.log('CCK::PatchMethods::CustomEquipKeyboardSkin');

    // Clear any CSS we've injected
    document.getElementById('cck_style')?.remove();

    // If the skin ID starts with 'cck_', it's a custom keyboard
    if (skinId.startsWith('cck_')) {
      return new Promise<boolean>(async (resolve) => {
        // Try to find the target keyboard in our keyboard entries list
        const selectedKeyboard = this.keyboards.getKeyboardEntries().filter((keyboard) => {
          return keyboard.class == skinId.substring(4);
        });

        // If we were able to find it, inject its CSS into the page, and set the custom keyboard
        if (selectedKeyboard.length > 0) {
          FileUtils.readFile(this.smm, selectedKeyboard[0]['cssPath'])
            .then(async (css) => {
              // Create and apply the <style> tag
              const style = document.createElement('style');
              style.id = 'cck_style';
              document.head.append(style);
              style.textContent = css;

              // Update the stored custom keyboard
              this.keyboards.setCustomKeyboard(skinId);
              await this.smm.Store.set(PLUGIN_ID, 'customKeyboard', skinId);

              resolve(true);
            })
            .catch((err) => {
              console.log('CCK::Error loading keyboard CSS: ', err);
              resolve(false);
            });
        } else {
          // If we couldn't find the selected keyboard, clear the custom keyboard
          this.keyboards.setCustomKeyboard(undefined);
          console.log('CCK::Error finding custom keyboard ', skinId);
          resolve(false);
        }
      });
    } else {
      // To allow for keeping an official keyboard while offline, we'll still store the keyboard
      // in our customKeyboard storage, but we'll also call the official Equip method if online
      this.keyboards.setCustomKeyboard(skinId);
      this.smm.Store.set(PLUGIN_ID, 'customKeyboard', skinId);

      // If we're online, update our equipped item. Otherwise just return a complete promise
      if (window.SystemNetworkStore.hasSteamConnection) {
        return this.userProfileStore._EquipKeyboardSkin.call(this.userProfileStore, skinId);
      } else {
        return new Promise<boolean>(async (resolve) => {resolve(true);});
      }
    }
  };

  CustomGetKeyboardSkinTheme = (): string => {
    console.log('CCK::PatchMethods::CustomGetKeyboardSkinTheme');

    // If a custom keyboard is set
    if (this.keyboards.getCustomKeyboard()) {
      // And it starts with cck_, return it minus the prefix
      if (this.keyboards.getCustomKeyboard().startsWith('cck_')) {
        return this.keyboards.getCustomKeyboard().substring(4);
      } else {
        // Otherwise pull what keyboard it is from our list of base keyboards if found
        if (this.keyboards.getCustomKeyboard() in baseKeyboardSkins)
        {
          return baseKeyboardSkins[this.keyboards.getCustomKeyboard()];
        }
      }
    }

    // If we made it this far, fall back to the base function
    return this.userProfileStore._GetKeyboardSkinTheme.call(this.userProfileStore);
  };

  CustomForceRefreshEquippedItems = (): void => {
    console.log('CCK::PatchMethods::CustomForceRefreshEquippedItems');

    // Call the base ForceRefreshEquippedItems, and hook into its promise
    this.userProfileStore._ForceRefreshEquippedItems.call(this.userProfileStore);

    this.userProfileStore.m_promiseEquipped.then(() => {
      // The m_equippedItems property is a Proxy, we'll add our own Proxy that watches for
      // calls to 'steam_deck_keyboard_skin', which we can hijack to make the selected skin correct
      // in the settings panel
      this.userProfileStore.m_equippedItems = new Proxy(this.userProfileStore.m_equippedItems, {
        get: (target, prop, receiver) => {
          if (prop === 'steam_deck_keyboard_skin' && this.keyboards.getCustomKeyboard()) {
            let keyboard = target.steam_deck_keyboard_skin;
            keyboard.communityitemid = this.keyboards.getCustomKeyboard();

            return keyboard;
          }

          // Any other property gets forwarded on to the original handler
          return Reflect.get(target, prop, receiver);
        },
      });
    });
  };
}
