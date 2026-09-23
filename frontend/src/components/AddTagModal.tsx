import React, { useState, useMemo } from 'react';
import { AppModal } from './AppModal';
import { addTagToMaterial } from '../api';
import type { ApiTag } from '../api';
import { useStore } from '../store/useStore';
import { Loader2 } from 'lucide-react';

interface Props {
  materialId: string;
  currentTags: { id: string; name: string }[];
  onClose: () => void;
  onTagAdded: (tag: ApiTag) => void;
}

export const AddTagModal: React.FC<Props> = ({ materialId, currentTags, onClose, onTagAdded }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const allTags = useStore(state => state.tags);
  
  const maxTagsReached = currentTags.length >= 5;

  const filteredTags = useMemo(() => {
    const lowerInput = inputValue.toLowerCase();
    return allTags.filter(tag => 
      tag.name.toLowerCase().includes(lowerInput) && 
      !currentTags.some(ct => ct.id === tag.id)
    );
  }, [inputValue, allTags, currentTags]);

  const handleAdd = async (tagId?: string, tagName?: string) => {
    if (maxTagsReached) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = tagId ? { tag_id: tagId } : { tag_name: tagName };
      const newTag = await addTagToMaterial(materialId, payload);
      onTagAdded(newTag);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add tag');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputValue.trim();
    if (!name) return;
    
    // Check if typed name matches an existing tag case-insensitively
    const existing = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      handleAdd(existing.id);
    } else {
      handleAdd(undefined, name);
    }
  };

  return (
    <AppModal isOpen={true} onClose={onClose} title="Add Tag" maxWidth="sm">
      {maxTagsReached ? (
        <div className="py-md">
          <input
            disabled
            value="Max 5 tags reached"
            className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface-variant opacity-70 cursor-not-allowed"
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
          <div>
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setError(null); }}
              placeholder="Type to search or create a new tag..."
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary"
              disabled={isSubmitting}
            />
          </div>
          
          {error && <p className="text-label-sm text-error">{error}</p>}
          
          {inputValue.trim() && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-left px-md py-sm rounded-lg text-label-md text-primary hover:bg-primary/10 transition-colors flex items-center gap-xs"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>+ Create "{inputValue.trim()}"</span>}
            </button>
          )}

          {filteredTags.length > 0 && (
            <div className="border-t border-outline-variant mt-sm pt-sm flex flex-col gap-[2px]">
              <div className="text-label-xs text-on-surface-variant uppercase mb-xs px-2">Existing Tags</div>
              {filteredTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAdd(tag.id)}
                  disabled={isSubmitting}
                  className="w-full text-left px-md py-sm rounded-lg hover:bg-surface-container-high transition-colors text-body-md flex justify-between items-center"
                >
                  <span>{tag.name}</span>
                  <span className="text-label-xs text-on-surface-variant opacity-60">{tag.material_count} materials</span>
                </button>
              ))}
            </div>
          )}
        </form>
      )}
    </AppModal>
  );
};
