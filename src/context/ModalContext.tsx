"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalContextType {
  isAnyModalOpen: boolean;
  registerModal: () => string;
  unregisterModal: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const registerModal = useCallback(() => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return id;
  }, []);

  const unregisterModal = useCallback((id: string) => {
    setOpenModals(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const openModal = useCallback((id: string) => {
    setOpenModals(prev => new Set(prev).add(id));
  }, []);

  const closeModal = useCallback((id: string) => {
    setOpenModals(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isAnyModalOpen = openModals.size > 0;

  return (
    <ModalContext.Provider value={{ isAnyModalOpen, registerModal, unregisterModal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalManager() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalManager must be used within ModalProvider');
  }
  return context;
}
