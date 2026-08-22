import React from 'react';
import type { Block } from '../store/useStore';

interface BlockNodeProps {
  block: Block & { children?: (Block & { children?: any[] })[] };
}

export const BlockNode: React.FC<BlockNodeProps> = ({ block }) => {
  const { id, block_type, text, children } = block;

  const renderContent = () => {
    switch (block_type) {
      case 'heading_1':
        return <h2 className="font-display-sm text-on-surface mb-xs mt-xl">{text}</h2>;
      case 'heading_2':
        return <h3 className="font-headline-md text-on-surface mb-xs mt-lg">{text}</h3>;
      case 'heading_3':
        return <h4 className="font-headline-sm text-on-surface-variant mb-xs mt-md">{text}</h4>;
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
