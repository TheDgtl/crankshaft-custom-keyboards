declare global {
  interface Window {
    webpackJsonp: any;
    userProfileStore: {
      GetKeyboardSkins: () => any;
      EquipKeyboardSkin: (skinId: string) => Promise<boolean>;
      GetKeyboardSkinTheme: () => string;
      ForceRefreshEquippedItems: () => void;
      GetProfileItemsOwned: (e: any) => Promise<any>;

      // Backups of the original methods, incase we are run twice
      _GetKeyboardSkins: any;
      _EquipKeyboardSkin: any;
      _GetKeyboardSkinTheme: any;
      _ForceRefreshEquippedItems: any;

      m_equippedItems: any;
      m_keyboardSkins: any;
      m_promiseEquipped: Promise<any>;
      m_strCachedKeyboardTheme: string;
      m_localStorage: {
        StoreObject: (key: string, value: Object) => any;
        GetObject: (key: string) => Promise<Object>;
      };
    };
  }
}

export {};
