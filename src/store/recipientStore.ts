import { create } from 'zustand';
import type { CareRecipient } from '../types/recipient';
import { recipientService } from '../services/recipient.service';

interface RecipientStore {
  recipients: CareRecipient[];
  activeRecipient: CareRecipient | null;
  isLoading: boolean;
  loadRecipients: () => Promise<void>;
  setActiveRecipient: (recipient: CareRecipient) => void;
  addRecipient: (data: Omit<CareRecipient, 'id' | 'createdBy' | 'createdAt'>) => Promise<CareRecipient>;
}

export const useRecipientStore = create<RecipientStore>((set, get) => ({
  recipients: [],
  activeRecipient: null,
  isLoading: false,

  loadRecipients: async () => {
    set({ isLoading: true });
    try {
      const recipients = await recipientService.getAll();
      const active = get().activeRecipient;
      set({
        recipients,
        activeRecipient: active || recipients[0] || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveRecipient: (recipient) => set({ activeRecipient: recipient }),

  addRecipient: async (data) => {
    const recipient = await recipientService.create(data);
    set((state) => ({
      recipients: [...state.recipients, recipient],
      activeRecipient: state.activeRecipient || recipient,
    }));
    return recipient;
  },
}));
