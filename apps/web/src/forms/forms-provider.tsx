'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { createFormsStore, type FormsState, type FormsStore } from './forms-store';

const FormsContext = createContext<FormsStore | null>(null);

/**
 * Hosts a single forms store for its subtree. Multiple named forms (via `useForm`)
 * share this one provider, each keyed by its own id.
 */
export function FormsProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<FormsStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createFormsStore();
  }
  return <FormsContext.Provider value={storeRef.current}>{children}</FormsContext.Provider>;
}

/** Subscribe to a slice of the forms store. */
export function useFormsStore<T>(selector: (state: FormsState) => T): T {
  const store = useContext(FormsContext);
  if (store === null) {
    throw new Error('useFormsStore must be used within a <FormsProvider>.');
  }
  return useStore(store, selector);
}

/** Access the store API (getState/setState) without subscribing. */
export function useFormsApi(): FormsStore {
  const store = useContext(FormsContext);
  if (store === null) {
    throw new Error('useFormsApi must be used within a <FormsProvider>.');
  }
  return store;
}
