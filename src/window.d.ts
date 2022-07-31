declare global {
  interface Window {
    webpackJsonp: any;
    userProfileStore: {
      GetKeyboardSkins: () => any;
      EquipKeyboardSkin: (skinId: string) => Promise<boolean>;
      GetKeyboardSkinTheme: () => string;
      GetEquippedItems: (bForce: boolean) => any;
      ForceRefreshEquippedItems: () => void;
      GetProfileItemsOwned: (e: any) => Promise<any>;
      GetEquippedProfileItemsForUser: (e: any) => Promise<any>;

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
