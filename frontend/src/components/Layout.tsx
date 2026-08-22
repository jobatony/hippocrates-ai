import React from 'react';
import { DocumentRenderer } from './DocumentRenderer';
import { QuestionRenderer } from './QuestionRenderer';
import { useStore } from '../store/useStore';
import { Book, Settings, Plus, Search, User } from 'lucide-react';

export const Layout: React.FC = () => {
  const { pendingQuestions, queueCount } = useStore();
  const MAX_QUEUE = 20;

  return (
    <div className="flex h-screen bg-background font-body-md text-on-surface overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-72 bg-surface-container-low border-r border-outline-variant z-50 flex flex-col shrink-0">
        <div className="p-md flex items-center gap-sm border-b border-outline-variant h-16">
          <span className="font-headline-md text-on-surface tracking-tight font-bold">Distinction AI</span>
        </div>
        <div className="flex-1 overflow-y-auto px-sm py-md space-y-xs">
          <div className="px-sm mb-xs text-label-sm text-on-surface-variant uppercase">Library</div>
          <nav className="space-y-xs">
            <a href="#" className="flex items-center px-md py-sm transition-colors bg-secondary-container text-on-secondary-container rounded-lg">
              <Book size={18} className="mr-sm" />
              Diabetes Mellitus
            </a>
            <a href="#" className="flex items-center px-md py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors">
              <Book size={18} className="mr-sm" />
              Neural Networks Basics
            </a>
          </nav>
        </div>
        <div className="p-md border-t border-outline-variant">
          <button className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-sm rounded-lg font-label-md hover:bg-primary-container transition-all">
            <Plus size={18} />
            Add New Material
          </button>
        </div>
        <div className="p-md border-t border-outline-variant">
          <a href="#" className="flex items-center gap-sm text-on-surface-variant hover:text-on-surface transition-colors">
            <Settings size={18} />
            <span className="text-label-md">Fine-tune AI prompt</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        <header className="h-16 flex items-center justify-between px-xl bg-surface/80 backdrop-blur-xl z-40 border-b border-outline-variant">
          <div className="flex items-center bg-surface-container-lowest p-xs rounded-full border border-outline-variant">
            <button className="px-lg py-1 rounded-full text-label-md bg-surface-container text-on-surface">Read</button>
            <button className="px-lg py-1 rounded-full text-label-md text-on-surface-variant hover:text-on-surface">Review</button>
          </div>
          <div className="flex items-center gap-md">
            <Search size={20} className="text-on-surface-variant cursor-pointer hover:text-on-surface" />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
              <User size={18} className="text-on-primary" />
            </div>
          </div>
        </header>

        <main className="flex-1 flex min-h-0 relative">
          {/* Central Panel: Document Reader */}
          <DocumentRenderer />

          {/* Right Panel: AI Review Queue */}
          <aside className="w-96 bg-surface-container flex flex-col shrink-0 border-l border-outline-variant">
            <header className="h-16 flex items-center justify-between px-md border-b border-outline-variant bg-surface-container-high shrink-0">
              <div className="font-headline-md text-on-surface text-[16px]">Review Queue</div>
              <div className="bg-surface-container-lowest px-sm py-xs rounded border border-outline-variant flex items-center gap-xs">
                <span className="text-label-sm text-on-surface-variant">Pending:</span>
                <span className="text-label-sm font-bold text-primary">{queueCount} / {MAX_QUEUE}</span>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {pendingQuestions.filter(q => q.status === 'pending').map((question) => (
                <QuestionRenderer key={question.id} question={question} />
              ))}
              
              {pendingQuestions.filter(q => q.status === 'pending').length === 0 && (
                <div className="flex flex-col items-center justify-center py-xl text-on-surface-variant text-center h-full opacity-50">
                   <p>No pending questions.</p>
                   <p className="text-label-sm mt-xs">Highlight text in the document to generate questions.</p>
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};
