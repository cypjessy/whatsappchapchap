"use client";

import { useEffect } from 'react';
import { createModalRegistration } from '@/lib/modal-registry';

/**
 * Hook to automatically register/unregister modals with the global registry
 * This enables Android back button to close modals instead of navigating away
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Function to call when back button should close the modal
 * 
 * Example usage:
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 * useModalBackHandler(showModal, () => setShowModal(false));
 * ```
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Register this modal when it opens
    const { cleanup } = createModalRegistration(onClose);

    // Unregister when modal closes or component unmounts
    return cleanup;
  }, [isOpen, onClose]);
}
