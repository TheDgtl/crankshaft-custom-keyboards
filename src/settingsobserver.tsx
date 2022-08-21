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
  private KEYBOARD_SETTINGS_CLASS = 'keyboardsettings_KeyboardThemeButtons';
  private patchAddr: any;

  // We use a singleton instance, because my vars in index.ts were being blown away on reload
  static getInstance(smm: SMM) {
    if (!this.instance) {
      this.instance = new SettingsObserver(smm);
    }

    return this.instance;
  }

  constructor(smm: SMM) {
    console.debug('CCK::SettingsObserver::constructor');
    this.smm = smm;
  }

  attachObserver = async (reloadKeyboards: () => void) => {
    console.debug('CCK::SettingsObserver::attachObserver');
    this.observer = new MutationObserver(this.patchSettings);
    this.observer.observe(document.body, { subtree: true, childList: true });

    // Find the module that contains a bunch of UI elements, by looking for modules with a lot
    // of exports, and looking for the one containing an export that contains "validateEmail"
    const modules = await this.smm.Patch.getModules();
    const uiModule = Object.values(modules).find((module: any) => {
      // Skip anything that isn't an object
      if (typeof module !== 'object' || !module) return false;
      
      // Skip anything with less than 60 keys
      if (Object.keys(module).length < 60) return false;

      // Look for any property that contains the property "validateEmail"
      for (const property in module) {
        if (module[property]?.validateEmail) {
          return true;
        }
      }

      return false;
    });

    const buttonComponent = Object.values(uiModule).find((property: any) => {
      const renderString = property.render?.toString();
      return renderString?.includes('type: "button"') && renderString?.includes('DialogButton');
    });

    this.patchAddr = await this.smm.Patch.patchExportFromContents({
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
        // Watch for the createElement call for the keyboard settings
        if (
          args?.length >= 1 &&
          args[1]?.className?.includes?.(this.KEYBOARD_SETTINGS_CLASS) &&
          args[1]?.children?.length === 2
        ) {
          // Force-enable the keyboard dropdown, so we can change keyboards even while offline
          if (args[1].children[0].props) {
            args[1].children[0].props.disabled = false;
          }
  
          // Create and inject our "Refresh" button
          args[1].children.splice(
            0,
            0,
            react.createElement(() => {
              return react.createElement(buttonComponent, {
                'data-cck-element': true,
                onClick: () => {
                  // Store the dropdown node, so we can focus it, as Steam loses focus when we refresh
                  const dropdownNode = window.FocusNavController?.m_LastActiveNavTree?.GetLastFocusedNode?.()?.Parent?.FindNextFocusableChildInDirection?.(0, 1);
                  reloadKeyboards();
                  dropdownNode?.BTakeFocus?.();
                },
              }, "Refresh");
            })
          );
        }
      },
    });
  };

  detachObserver = () => {
    console.debug('CCK::SettingsObserver::detachObserver');
    this.observer?.disconnect();

    // Unpatch createElement
    if (this.patchAddr) {
      this.smm.Patch.removePatch(this.patchAddr);
    }

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
    const settingsElement = document.querySelector(`[class^=${this.KEYBOARD_SETTINGS_CLASS}]`);
    if (settingsElement && !settingsElement.hasAttribute('data-cck-settings')) {
      console.debug('CCK::SettingsObserver Found element');
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
    return settingsElement.children[1]?.children[0]?.children[0] as HTMLElement;
  }

  private getDropdownSpacerElement = (settingsElement: Element) => {
    return settingsElement.children[1]?.children[0]?.children[1] as HTMLElement;
  }
}
