import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { MaterialCard } from './MaterialCard';
import { fetchMaterialDetail, renameMaterial, deleteMaterial, fetchMaterials, fetchTags } from '../api';
import { AppModal } from './AppModal';
import { AddTagModal } from './AddTagModal';
import { Loader2, Trash2 } from 'lucide-react';
import type { Material } from '../store/useStore';

interface Props {
  onClose: () => void;
}

export const MaterialsScreen: React.FC<Props> = ({ onClose }) => {
  const { materials, setMaterials, activeTagId, tags, setActiveMaterial, setMode, setDocumentBlocks, setLoadingDocument, setFlagBlockId, activeMaterialId } = useStore();

  const [renamingMaterial, setRenamingMaterial] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [addingTagFor, setAddingTagFor] = useState<Material | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');

  const filtered = activeTagId
    ? materials.filter(m => m.tags?.some(t => t.id === activeTagId))
    : materials;

  const activeTagName = tags.find(t => t.id === activeTagId)?.name;

  const handleOpen = async (material: Material) => {
    setActiveMaterial(material.id, material.title);
    setMode('read');
    setLoadingDocument(true);
    setDocumentBlocks([]);
    onClose();
    try {
      const detail = await fetchMaterialDetail(material.id);
      setDocumentBlocks(detail.blocks as any);
      setFlagBlockId(detail.last_block_id ?? null);
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleRename = async () => {
    if (!renamingMaterial || !renameTitle.trim() || renameTitle === renamingMaterial.title) {
      setRenamingMaterial(null);
      return;
    }
    setIsProcessing(true);
    try {
      await renameMaterial(renamingMaterial.id, renameTitle);
      setMaterials(materials.map(m => m.id === renamingMaterial.id ? { ...m, title: renameTitle } : m));
      if (activeMaterialId === renamingMaterial.id) {
        setActiveMaterial(renamingMaterial.id, renameTitle);
      }
      setRenamingMaterial(null);
    } catch (err) {
      alert("Failed to rename material");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    setIsProcessing(true);
    try {
      await deleteMaterial(materialToDelete.id);
      setMaterials(materials.filter(m => m.id !== materialToDelete.id));
      if (activeMaterialId === materialToDelete.id) {
        setActiveMaterial(null as any, '');
        setDocumentBlocks([]);
      }
      setMaterialToDelete(null);
    } catch (err) {
      alert("Failed to delete material");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-xl">
      <h2 className="font-headline-lg text-on-surface mb-md">
        {activeTagName ? `# ${activeTagName}` : 'All Materials'}
      </h2>
      {filtered.length === 0 ? (
        <p className="text-on-surface-variant opacity-60">No materials found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
          {filtered.map(m => (
            <MaterialCard
              key={m.id}
              material={m}
              onClick={() => handleOpen(m)}
              onRename={() => { setRenamingMaterial(m); setRenameTitle(m.title); }}
              onAddTag={() => setAddingTagFor(m)}
              onDelete={() => setMaterialToDelete(m)}
            />
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {renamingMaterial && (
        <AppModal isOpen={true} onClose={() => setRenamingMaterial(null)} title="Rename Material" maxWidth="sm">
          <div className="flex flex-col gap-md">
            <input
              autoFocus
              type="text"
              value={renameTitle}
              onChange={e => setRenameTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setRenamingMaterial(null);
              }}
              disabled={isProcessing}
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-sm mt-sm">
              <button
                onClick={() => setRenamingMaterial(null)}
                disabled={isProcessing}
                className="px-md py-sm rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={isProcessing || !renameTitle.trim()}
                className="px-md py-sm rounded-lg text-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-xs"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </AppModal>
      )}

      {/* Add Tag Modal */}
      {addingTagFor && (
        <AddTagModal
          materialId={addingTagFor.id}
          currentTags={addingTagFor.tags ?? []}
          onClose={() => setAddingTagFor(null)}
          onTagAdded={async () => {
            const [mats, tgs] = await Promise.all([fetchMaterials(), fetchTags()]);
            useStore.getState().setMaterials(mats);
            useStore.getState().setTags(tgs);
          }}
        />
      )}

      {/* Delete Modal */}
      {materialToDelete && (
        <AppModal isOpen={true} onClose={() => setMaterialToDelete(null)} title="Delete Material?" hideCloseButton>
          <div className="flex flex-col items-center text-center mt-md">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-md">
              <Trash2 size={24} />
            </div>
            <p className="text-body-md text-on-surface-variant w-full whitespace-normal break-words">
              Are you sure you want to delete <span className="font-bold text-on-surface break-all">"{materialToDelete.title}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-sm mt-xl">
            <button
              onClick={() => setMaterialToDelete(null)}
              disabled={isProcessing}
              className="px-lg py-sm rounded-full text-label-md font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isProcessing}
              className="px-lg py-sm rounded-full text-label-md font-bold bg-error text-on-error hover:bg-error/90 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-xs"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
            </button>
          </div>
        </AppModal>
      )}
    </div>
  );
};
