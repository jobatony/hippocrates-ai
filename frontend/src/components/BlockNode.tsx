import React from 'react';
import type { Block } from '../store/useStore';

interface BlockNodeProps {
  block: Block & { children?: Block[] };
}

export const BlockNode: React.FC<BlockNodeProps> = ({ block }) => {
  const { id, block_type, text, children } = block;

  const renderContent = () => {
    switch (block_type) {
      case 'heading':
        return <h3 className="font-headline-md text-on-surface mb-xs mt-lg">{text}</h3>;
      case 'paragraph':
        return <p className="mb-md text-body-lg text-on-surface leading-relaxed">{text}</p>;
      case 'list_item':
        return <li className="ml-md list-disc text-body-lg text-on-surface">{text}</li>;
      default:
        return <p className="mb-md text-body-lg">{text}</p>;
    }
  };

  return (
    <div data-block-id={id} className="relative group p-xs -mx-xs rounded hover:bg-surface-container-lowest transition-colors">
      {renderContent()}
      {children && children.length > 0 && (
        <div className="pl-4">
          {children.map(child => (
            <BlockNode key={child.id} block={child} />
          ))}
        </div>
      )}
    </div>
  );
};
