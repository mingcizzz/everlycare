import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OUTDOOR_KEY = 'everlycare.outdoor.active';

export interface ChecklistItem {
  id: string;
  /** i18n key to look up via t(labelKey) */
  labelKey: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'toilet', labelKey: 'home.outdoor.check1' },
  { id: 'spare',  labelKey: 'home.outdoor.check2' },
  { id: 'time',   labelKey: 'home.outdoor.check3' },
].map(i => ({ ...i, checked: false }));

interface OutdoorModeStore {
  isOutdoor: boolean;
  activatedAt: string | null;
  checklist: ChecklistItem[];
  showChecklist: boolean;
  /** Load persisted state — call once on app start */
  initOutdoor: () => Promise<void>;
  /** Open the pre-departure checklist modal */
  openChecklist: () => void;
  /** Close the checklist modal without changing outdoor mode state */
  closeChecklist: () => void;
  /** Toggle a single checklist item */
  toggleChecklistItem: (id: string) => void;
  /** Confirm departure — persists and activates outdoor mode */
  confirmOutdoor: () => Promise<void>;
  /** Deactivate outdoor mode */
  deactivateOutdoor: () => Promise<void>;
}

export const useOutdoorModeStore = create<OutdoorModeStore>((set) => ({
  isOutdoor: false,
  activatedAt: null,
  checklist: DEFAULT_CHECKLIST.map(i => ({ ...i })),
  showChecklist: false,

  initOutdoor: async () => {
    try {
      const raw = await AsyncStorage.getItem(OUTDOOR_KEY);
      if (raw) {
        const { isOutdoor, activatedAt } = JSON.parse(raw);
        set({ isOutdoor, activatedAt });
      }
    } catch { /* ignore */ }
  },

  openChecklist: () =>
    set({ showChecklist: true, checklist: DEFAULT_CHECKLIST.map(i => ({ ...i })) }),

  closeChecklist: () =>
    set({ showChecklist: false }),

  toggleChecklistItem: (id) =>
    set(state => ({
      checklist: state.checklist.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    })),

  confirmOutdoor: async () => {
    const activatedAt = new Date().toISOString();
    await AsyncStorage.setItem(OUTDOOR_KEY, JSON.stringify({ isOutdoor: true, activatedAt }));
    set({ isOutdoor: true, activatedAt, showChecklist: false });
  },

  deactivateOutdoor: async () => {
    await AsyncStorage.removeItem(OUTDOOR_KEY);
    set({ isOutdoor: false, activatedAt: null });
  },
}));
