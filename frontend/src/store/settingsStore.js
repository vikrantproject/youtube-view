import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  showDisclaimer: true,
  darkMode: false,
  
  setShowDisclaimer: (show) => set({ showDisclaimer: show }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode }))
}));

export default useSettingsStore;
