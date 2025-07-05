
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

interface ConfirmationOptions {
  message: string;
  onConfirm: () => void;
}

interface ConfirmationContextType {
  showConfirmation: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationOptions | null>(null);

  const showConfirmation = useCallback((options: ConfirmationOptions) => {
    setConfirmationState(options);
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationState(null);
  }, []);

  const handleConfirm = () => {
    if (confirmationState) {
      confirmationState.onConfirm();
      hideConfirmation();
    }
  };

  return (
    <ConfirmationContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmationModal
        isOpen={!!confirmationState}
        onClose={hideConfirmation}
        onConfirm={handleConfirm}
        message={confirmationState?.message || ''}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = (): ConfirmationContextType => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
