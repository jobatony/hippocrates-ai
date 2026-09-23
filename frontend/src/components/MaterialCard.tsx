import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { HelpCircle, MoreVertical } from 'lucide-react';
import type { Material } from '../store/useStore';
import { TagChip } from './TagChip';

interface Props {
  material: Material;
  onClick: () => void;
  onRename?: () => void;
  onAddTag?: () => void;
  onDelete?: () => void;
}

export const MaterialCard: React.FC<Props> = ({ material, onClick, onRename, onAddTag, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseLeave={() => setShowMenu(false)}
      className="bg-surface-container rounded-xl p-lg border border-outline-variant
        hover:border-primary cursor-pointer transition-all shadow-sm hover:shadow-md group flex flex-col min-h-[160px] min-w-0 relative"
    >
      <div className="flex items-start justify-between gap-sm mb-xs">
        <h3
          className="font-headline-sm text-on-surface truncate min-w-0 group-hover:text-primary transition-colors flex-1 text-left"
          title={material.title}
        >
          {material.title}
        </h3>

        {(onRename || onAddTag || onDelete) && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className={`p-1 rounded hover:bg-surface-variant transition-colors ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <MoreVertical size={16} className="text-on-surface-variant" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-8 w-36 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 p-1 flex flex-col gap-[2px]"
                onClick={e => e.stopPropagation()}
              >
                {onRename && (
                  <button onClick={() => { setShowMenu(false); onRename(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container text-label-md text-on-surface transition-colors">
                    Rename
                  </button>
                )}
                {onAddTag && (!material.tags || material.tags.length < 5) && (
                  <button onClick={() => { setShowMenu(false); onAddTag(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container text-label-md text-on-surface transition-colors">
                    Add Tag
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { setShowMenu(false); onDelete(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-error-container text-error text-label-md transition-colors">
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-xs mb-md flex-1 content-start overflow-hidden max-h-[48px]">
        {material.tags && material.tags.map(tag => (
          <TagChip key={tag.id} label={tag.name} />
        ))}
      </div>

      <div className="flex flex-col items-start gap-[4px] text-label-sm text-on-surface-variant">
        <div className="flex flex-col items-start opacity-70 leading-tight">
          <span className="text-[11px]">Created</span>
          <span>{material.created_at ? formatDistanceToNow(new Date(material.created_at), { addSuffix: true }) : ''}</span>
        </div>
        <span className="flex items-center gap-xs">
          <HelpCircle size={14} />
          {material.question_count} question{material.question_count !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mt-sm">
        <div className="flex justify-end text-label-xs text-on-surface-variant mb-[3px]">
          <span>{material.reading_progress ?? 0}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-1.5 bg-primary rounded-full transition-all"
            style={{ width: `${material.reading_progress ?? 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};
