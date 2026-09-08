import React from 'react';
import type { TrueFalsePayload } from '../store/useStore';
import { Plus, Minus } from 'lucide-react';

interface Props {
  payload: TrueFalsePayload;
  isEditing: boolean;
  onChange: (newPayload: TrueFalsePayload) => void;
}

export const TrueFalseRenderer: React.FC<Props> = ({ payload, isEditing, onChange }) => {
  if (isEditing) {
    return (
      <div className="space-y-sm">
        <input
          value={payload.stem}
          onChange={e => onChange({ ...payload, stem: e.target.value })}
          className="w-full p-sm bg-surface rounded border border-outline text-body-md font-medium text-on-surface focus:outline-none focus:border-primary"
          placeholder="Stem Question (e.g. Concerning diabetes...)"
        />
        
        <div className="space-y-md mt-sm">
          {payload.statements.map((stmt, i) => (
            <div key={i} className="p-sm bg-surface-container-lowest border border-outline-variant rounded-lg space-y-xs relative group">
              <input
                type="text"
                value={stmt.true_statement}
                onChange={e => {
                  const newStmts = [...payload.statements];
                  newStmts[i].true_statement = e.target.value;
                  onChange({ ...payload, statements: newStmts });
                }}
                className="w-full p-xs bg-transparent border-b border-outline focus:outline-none focus:border-primary text-body-md"
                placeholder="True Statement"
              />
              <input
                type="text"
                value={stmt.false_alternative}
                onChange={e => {
                  const newStmts = [...payload.statements];
                  newStmts[i].false_alternative = e.target.value;
                  onChange({ ...payload, statements: newStmts });
                }}
                className="w-full p-xs bg-transparent border-b border-outline focus:outline-none focus:border-error text-body-md text-error"
                placeholder="False Alternative"
              />
              
              {payload.statements.length > 1 && (
                <button
                  onClick={() => {
                    const newStmts = payload.statements.filter((_, idx) => idx !== i);
                    onChange({ ...payload, statements: newStmts });
                  }}
                  className="absolute -right-2 -top-2 w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={() => onChange({
            ...payload, 
            statements: [...payload.statements, { true_statement: '', false_alternative: '' }]
          })}
          className="w-full py-xs mt-sm flex items-center justify-center gap-xs text-primary bg-primary-container/20 rounded hover:bg-primary-container/40 transition-colors"
        >
          <Plus size={16} /> Add Statement Pair
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="font-body-md font-medium text-on-surface mb-md">{payload.stem}</p>
      
      <div className="space-y-sm">
        {payload.statements.map((stmt, i) => (
          <div key={i} className="p-sm bg-surface rounded-lg shadow-sm border border-outline-variant">
            <div className="text-body-md text-on-surface mb-xs">
              <span className="inline-block w-6 text-primary font-bold">T:</span> {stmt.true_statement}
            </div>
            <div className="text-body-md text-error italic">
              <span className="inline-block w-6 font-bold">F:</span> {stmt.false_alternative}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
