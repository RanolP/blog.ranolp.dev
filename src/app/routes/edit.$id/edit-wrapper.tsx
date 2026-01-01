import { useState, createContext, useContext } from 'react';

interface SaveStateContextType {
  isSaving: boolean;
  lastSavedAt: Date | null;
  setIsSaving: (value: boolean) => void;
  setLastSavedAt: (value: Date) => void;
}

const SaveStateContext = createContext<SaveStateContextType | null>(null);

export function useSaveState() {
  const context = useContext(SaveStateContext);
  if (!context) {
    throw new Error('useSaveState must be used within SaveStateProvider');
  }
  return context;
}

interface SaveStateProviderProps {
  children: React.ReactNode;
}

export function SaveStateProvider({ children }: SaveStateProviderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  return (
    <SaveStateContext.Provider
      value={{ isSaving, lastSavedAt, setIsSaving, setLastSavedAt }}
    >
      {children}
    </SaveStateContext.Provider>
  );
}
