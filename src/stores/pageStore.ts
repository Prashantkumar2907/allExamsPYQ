import { create } from 'zustand';

interface PageState {
  title: string;
  description: string;
  setPage: (title: string, description?: string) => void;
}

export const usePageStore = create<PageState>((set) => ({
  title: '',
  description: '',
  setPage: (title, description = '') => set({ title, description }),
}));
