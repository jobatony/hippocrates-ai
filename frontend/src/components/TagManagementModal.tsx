import React, { useState } from 'react';
import { AppModal } from './AppModal';
import { renameTag, deleteTag, fetchMaterials } from '../api';
import type { ApiTag } from '../api';
import { useStore } from '../store/useStore';
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  tag: ApiTag | null;
  onClose: () => void;
  initialView?: 'view' | 'renaming' | 'confirmDelete';
}

export const TagManagementModal: React.FC<Props> = ({ tag, onClose, initialView = 'view' }) => {
  const [view, setView] = useState<'view' | 'renaming' | 'confirmDelete'>(initialView);
  const [newName, setNewName] = useState(tag?.name || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const { renameTagInStore, removeTag, setMaterials } = useStore();

  if (!tag) return null;

  const handleRename = async () => {
    if (!newName.trim() || newName === tag.name) {
      setView('view');
      return;
    }
    setIsProcessing(true);
    try {
      await renameTag(tag.id, newName.trim());
      renameTagInStore(tag.id, newName.trim());
      // Refresh materials so the updated tag name shows up in the materials lists
      const updatedMaterials = await fetchMaterials();
      setMaterials(updatedMaterials);
      onClose();
    } catch (err) {
      alert("Failed to rename tag.");
      setIsProcessing(false);
    }
  };

  const handleStartDelete = () => {
    setView('confirmDelete');
  };

  const confirmDeleteAction = async () => {
    setIsProcessing(true);
    try {
      await deleteTag(tag.id);
      removeTag(tag.id);
      const updatedMaterials = await fetchMaterials();
      setMaterials(updatedMaterials);
      onClose();
    } catch (err) {
      alert("Failed to delete tag.");
      setIsProcessing(false);
    }
  };

  if (view === 'renaming') {
    return (
      <AppModal isOpen={true} onClose={onClose} title="Rename Tag" maxWidth="xs">
        <div className="flex flex-col gap-md">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setView('view');
            }}
            disabled={isProcessing}
            className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-label-md text-on-surface focus:outline-none focus:border-primary"
          />
          <div className="flex justify-end gap-sm mt-sm">
            <button
              onClick={() => setView('view')}
              disabled={isProcessing}
              className="px-md py-sm rounded-lg text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              disabled={isProcessing || !newName.trim()}
              className="px-md py-sm rounded-lg text-label-sm bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-xs"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      </AppModal>
    );
  }

  if (view === 'confirmDelete') {
    return (
      <AppModal isOpen={true} onClose={onClose} title="Delete Tag" maxWidth="xs" hideCloseButton>
        <div className="flex flex-col items-center text-center pb-md">
          <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center mb-md">
            <AlertTriangle size={20} />
          </div>
          <p className="text-label-md text-on-surface-variant mb-md">
            Are you sure you want to delete the tag <span className="font-bold text-on-surface">"{tag.name}"</span>?
          </p>
          {tag.material_count === 1 ? (
            <p className="text-label-sm text-on-surface-variant bg-surface-container-high p-sm rounded-lg text-left w-full">
              This is the <span className="font-bold">only</span> material it is currently appearing in. Deleting it will remove it completely from the database.
            </p>
          ) : tag.material_count > 1 ? (
            <p className="text-label-sm text-on-surface-variant bg-surface-container-high p-sm rounded-lg text-left w-full">
              This tag will be removed from <span className="font-bold">{tag.material_count}</span> materials.
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-sm mt-md">
          <button
            onClick={() => setView('view')}
            disabled={isProcessing}
            className="px-md py-sm rounded-full text-label-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteAction}
            disabled={isProcessing}
            className="px-md py-sm rounded-full text-label-sm font-bold bg-error text-on-error hover:bg-error/90 shadow-sm transition-colors flex items-center justify-center gap-xs"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Delete Tag'}
          </button>
        </div>
      </AppModal>
    );
  }

  // view === 'view'
  return (
    <AppModal isOpen={true} onClose={onClose} title={`Manage Tag: ${tag.name}`} maxWidth="xs">
      <div className="flex flex-col gap-xs">
        <button
          onClick={() => setView('renaming')}
          className="w-full text-left px-md py-sm rounded-lg hover:bg-surface-container-high flex items-center gap-sm text-label-md text-on-surface transition-colors"
        >
          <Pencil size={16} className="text-on-surface-variant" />
          Rename Tag
        </button>
        <button
          onClick={handleStartDelete}
          className="w-full text-left px-md py-sm rounded-lg hover:bg-error-container/50 flex items-center gap-sm text-label-md text-error transition-colors"
        >
          <Trash2 size={16} />
          Delete Tag
        </button>
      </div>
    </AppModal>
  );
};
