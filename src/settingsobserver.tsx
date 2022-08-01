/*
 * Crankshaft-Custom-Keyboards, a custom keyboard plugin for Crankshaft
 * Copyright (C) 2022 Steven "Drakia" Scott
 * 
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 */

import { SMM } from '@crankshaft/types';

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

  attachObserver = async (reloadKeyboards: () => void) => {
    console.log('CCK::SettingsObserver::attachObserver');
    this.observer = new MutationObserver(this.patchSettings);

    this.observer.observe(document.body, { subtree: true, childList: true });

    // Get Steam slider component
    const modules = await (this.smm.Patch as any).getModules();
    const buttonComponent = Object.values(modules[2].c['7ast'].exports).find((a: any) => {
      return a.render?.toString().includes('type: "button"') && a.render?.toString().includes('DialogButton');
    });

    // Patch the 'createElement' method, so we can inject our own control in the settings panel
    await this.smm.Patch.patchExportFromContents({
      contents: [
        'useState',
        'useEffect',
        'useCallback',
        'useMemo',
        'memo',
        'createElement',
      ],
      export: 'createElement',
      callback: (origFunc, react, ...args) => {
        if (
          args.length >= 1 &&
          args[1]?.className?.includes('keyboardsettings_KeyboardThemeButtons') &&
          args[1].children
        ) {
          console.log("refresh");
          args[1].children.splice(
            0,
            0,
            react.createElement(() => {
              return react.createElement(buttonComponent, {
                onClick: reloadKeyboards,
              }, "Refresh");
            })
          );
        }
        return origFunc(...args);
      },
    });
  };

  detachObserver = () => {
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
  };

  private patchSettings = () => {
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
    }
  }

  private getDropdownTextElement = (settingsElement: Element) => {
    return settingsElement.children[0]?.children[0]?.children[0] as HTMLElement;
  }

  private getDropdownSpacerElement = (settingsElement: Element) => {
    return settingsElement.children[0]?.children[0]?.children[1] as HTMLElement;
  }
}
