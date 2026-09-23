import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { useStore } from '../store/useStore';
import { searchMaterials } from '../api';

interface SearchBarProps {
  onClose?: () => void;
  isMobileExpanded?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClose, isMobileExpanded }) => {
  const { setSearchResults, setSearchQuery } = useStore();
  const [value, setValue] = useState('');

  const doSearch = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      setSearchQuery('');
      return;
    }
    setSearchQuery(q);
    const results = await searchMaterials(q).catch(() => null);
    if (results) setSearchResults(results);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    doSearch(e.target.value);
  };

  const handleClear = () => {
    setValue('');
    setSearchResults(null);
    setSearchQuery('');
    if (onClose) onClose();
  };

  return (
    <div className={`relative flex items-center bg-surface-container-highest rounded-full
      px-md py-xs border border-outline-variant focus-within:border-primary transition-all
      w-full ${isMobileExpanded ? 'max-w-full md:max-w-[260px] lg:max-w-xs' : 'max-w-[180px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-xs'} ml-auto sm:ml-4 shrink`}>
      <Search size={16} className="text-on-surface-variant shrink-0" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search materials & tags…"
        className="flex-1 min-w-0 bg-transparent px-sm text-label-sm sm:text-body-sm text-on-surface
          placeholder:text-on-surface-variant focus:outline-none truncate"
      />
      {(value || isMobileExpanded) && (
        <button onClick={handleClear} className="shrink-0 p-1 flex items-center justify-center">
          <X size={14} className="text-on-surface-variant hover:text-on-surface" />
        </button>
      )}
    </div>
  );
};
