/**
 * Global Modal Registry for Android Back Button Handling
 * Tracks which modals are currently open so back button can close them instead of navigating
 */

type ModalCloseHandler = () => void;

class ModalRegistry {
  private modals: Map<string, ModalCloseHandler> = new Map();

  /**
   * Register a modal with its close handler
   * @param id Unique modal identifier
   * @param closeHandler Function to call when back button should close this modal
   */
  register(id: string, closeHandler: ModalCloseHandler): void {
    this.modals.set(id, closeHandler);
  }

  /**
   * Unregister a modal when it's closed/destroyed
   * @param id Modal identifier to remove
   */
  unregister(id: string): void {
    this.modals.delete(id);
  }

  /**
   * Check if any modals are currently open
   */
  hasOpenModals(): boolean {
    return this.modals.size > 0;
  }

  /**
   * Close the most recently opened modal (LIFO order)
   * Returns true if a modal was closed, false if no modals were open
   */
  closeTopModal(): boolean {
    if (this.modals.size === 0) return false;

    // Get the last registered modal (most recent)
    const entries = Array.from(this.modals.entries());
    const [id, closeHandler] = entries[entries.length - 1];
    
    // Call the close handler
    closeHandler();
    
    // Remove from registry
    this.modals.delete(id);
    
    return true;
  }

  /**
   * Get count of open modals (for debugging)
   */
  getOpenModalCount(): number {
    return this.modals.size;
  }
}

// Export singleton instance
export const modalRegistry = new ModalRegistry();

/**
 * Helper hook to automatically register/unregister modals
 * Usage: const { modalId } = useModalRegistration(onClose);
 */
export function createModalRegistration(closeHandler: ModalCloseHandler): { modalId: string; cleanup: () => void } {
  const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  modalRegistry.register(modalId, closeHandler);

  const cleanup = () => {
    modalRegistry.unregister(modalId);
  };

  return { modalId, cleanup };
}
