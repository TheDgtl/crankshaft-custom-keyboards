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
  private patchCreateElement: any;

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

    // Get Steam button component
    // Note: This is completely unsafe, and only works with unminified code
    const modules = await (this.smm.Patch as any).getModules();
    const buttonComponent = Object.values(modules[2].c['7ast'].exports).find((a: any) => {
      return a.render?.toString().includes('type: "button"') && a.render?.toString().includes('DialogButton');
    });

    // Patch the 'createElement' method, so we can inject our own control in the settings panel
    this.patchCreateElement = (_origFunc: (...args: any[]) => any, react: any, ...args: any[]) => {
      if (
        args?.length >= 1 &&
        args[1]?.className?.includes?.(this.KEYBOARD_SETTINGS_CLASS) &&
        args[1]?.children?.length === 2
      ) {
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
    };

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
      // We wrap this so we can no-op patchCreateElement on unload
      callback: (origFunc, react, ...args) => {
        this.patchCreateElement(origFunc, react, ...args);
      },
    });
  };

  detachObserver = () => {
    console.log('CCK::SettingsObserver::detachObserver');
    this.observer?.disconnect();

    // No-op our patch method, since we can't unpatch currently
    this.patchCreateElement = () => {};

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
    return settingsElement.children[1]?.children[0]?.children[0] as HTMLElement;
  }

  private getDropdownSpacerElement = (settingsElement: Element) => {
    return settingsElement.children[1]?.children[0]?.children[1] as HTMLElement;
  }
}
