import { create } from 'zustand';

export type AuthMode = 'signIn' | 'signUp';

interface AuthUIState {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  toggleMode: () => void;
}

/** UI-only state for the login page (zustand). Form state lives in the FormsProvider. */
export const useAuthUIStore = create<AuthUIState>((set) => ({
  mode: 'signIn',
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((state) => ({ mode: state.mode === 'signIn' ? 'signUp' : 'signIn' })),
}));
