import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import type { BrowseOptions, CatalogLanguage, MediaType } from '../types/movie';

interface BrowseContextValue extends BrowseOptions {
  setMediaType: (type: MediaType) => void;
  setLanguage: (language: CatalogLanguage) => void;
}
const BrowseContext = createContext<BrowseContextValue | null>(null);

export function BrowseProvider({ children }: PropsWithChildren) {
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [language, setLanguage] = useState<CatalogLanguage>('all');
  return (
    <BrowseContext.Provider value={{ mediaType, language, setMediaType, setLanguage }}>
      {children}
    </BrowseContext.Provider>
  );
}

export function useBrowse() {
  const value = useContext(BrowseContext);
  if (!value) throw new Error('useBrowse must be used within BrowseProvider');
  return value;
}
