import React from 'react';
import { AppModal } from './AppModal';
import { useStore } from '../store/useStore';
import { TagChip } from './TagChip';

interface Props {
  onClose: () => void;
  onManageTag: (tag: import('../api').ApiTag) => void;
}

export const SeeAllTagsModal: React.FC<Props> = ({ onClose, onManageTag }) => {
  const { tags, activeTagId, setActiveTagId } = useStore();

  return (
    <AppModal isOpen={true} onClose={onClose} title="All Tags" maxWidth="md" heightClass="h-[240px] sm:h-[300px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm p-sm">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center group relative min-w-0">
            <div className="flex-1 min-w-0">
              <TagChip
                label={`${tag.name} (${tag.material_count})`}
                active={activeTagId === tag.id}
                className="w-full max-w-full"
                onClick={() => {
                  setActiveTagId(tag.id === activeTagId ? null : tag.id);
                  onClose();
                }}
              />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onManageTag(tag); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-primary transition-opacity"
              title="Manage Tag"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        ))}
      </div>
    </AppModal>
  );
};
