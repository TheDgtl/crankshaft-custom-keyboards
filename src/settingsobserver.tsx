/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '../types/smm';
import { h } from 'dom-chef';

export class SettingsObserver {
  private smm: SMM;
  private observer: MutationObserver | undefined;
  private static instance: SettingsObserver;
  private KEYBOARD_SETTINGS_SELECTOR = '[class^=keyboardsettings_KeyboardThemeButtons]';

  // We use a singleton instance, because my vars in index.ts were being blown away on reload
  static getInstance(smm: SMM) {
    if (!this.instance) {
      this.instance = new SettingsObserver(smm);
    }

    return this.instance;
  }

  constructor(smm: SMM) {
    console.log('CCK::SettingsObserver::constructor');
    this.smm = smm;
  }

  attachObserver(reloadKeyboards: () => void) {
    console.log('CCK::SettingsObserver::attachObserver');
    this.observer = new MutationObserver(() => {
      // Look for the keyboardsettings element, and modify it if we haven't already
      const settingsElement = document.querySelector(this.KEYBOARD_SETTINGS_SELECTOR);
      if (settingsElement && !settingsElement.hasAttribute('data-cck-settings')) {
        console.log('CCK::SettingsObserver Found element');
        settingsElement.setAttribute('data-cck-settings', '');

        // Set the parent elements width to 100%, this drops the settings below the title
        if (settingsElement.parentElement) {
          settingsElement.parentElement.style.width = '100%';
        }

        // Adjust the properties of the dropdown to look better
        const dropdownText = this.getDropdownTextElement(settingsElement);
        if (dropdownText) {
          dropdownText.style.flexGrow = '1';
        }
        const dropdownSpacer = this.getDropdownSpacerElement(settingsElement);
        if (dropdownSpacer) {
          dropdownSpacer.style.display = 'none';
        }

        // Create a new button element, copying the classes of the dropdown
        const dropdownClasses = settingsElement.children[0]?.className;
        const reloadButton = (
          <button className={dropdownClasses} tabIndex={0} onClick={reloadKeyboards} data-cck-element>
            Reload
          </button>
        );
        reloadButton.classList.remove('Disabled');
        settingsElement.prepend(reloadButton);
      }
    });

    this.observer.observe(document.body, { subtree: true, childList: true });
  }

  detachObserver() {
    console.log('CCK::SettingsObserver::detachObserver');
    this.observer?.disconnect();

    // Remove any elements we created
    document.querySelector('[data-cck-element]')?.remove();

    // Undo any changes we made, in case we're still on the settings panel
    const settingsElement = document.querySelector('[data-cck-settings]');
    if (settingsElement) {
      settingsElement.parentElement?.removeAttribute('style');
      this.getDropdownTextElement(settingsElement)?.removeAttribute('style');
      this.getDropdownSpacerElement(settingsElement)?.removeAttribute('style');
      settingsElement.removeAttribute('data-cck-settings');
    }
  }

  private getDropdownTextElement(settingsElement: Element) {
    return settingsElement.children[0]?.children[0]?.children[0] as HTMLElement;
  }

  private getDropdownSpacerElement(settingsElement: Element) {
    return settingsElement.children[0]?.children[0]?.children[1] as HTMLElement;
  }
}
