import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { currentUser, setMode } = useStore();

  // Clear any lingering text selection whenever the route changes.
  // This prevents the fixed FAB in DocumentRenderer from getting stuck
  // on top of the new page and blocking all pointer events.
  useEffect(() => {
    window.getSelection()?.removeAllRanges();
    // Also force-reset the cursor style on the body in case it got stuck
    document.body.style.cursor = '';
  }, [location.pathname]);

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Library',   path: '/library', onClick: () => setMode('read') },
    { label: 'Quiz',      path: '/quiz' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      <div className="h-20 w-full px-spacing-xl flex items-center justify-between gap-spacing-lg max-w-7xl mx-auto">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-spacing-md flex-shrink-0">
          <div className="flex flex-col">
            <span className="font-title-md text-title-md text-on-surface tracking-tight leading-none font-bold text-xl">Hippocrates AI</span>
          </div>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden lg:flex items-center gap-spacing-xs bg-surface-container-low px-spacing-xs py-1.5 rounded-full">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={link.onClick}
                className={`px-spacing-md py-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-title-sm'
                    : 'text-label-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search + Bell + Avatar */}
        <div className="flex items-center gap-spacing-md">
          {/* Note: We will integrate the existing SearchBar component here or leave it simple for now */}
          <div className="hidden md:flex items-center bg-surface-container-low px-spacing-md py-2 rounded-xl text-on-surface-variant w-64 justify-between cursor-pointer hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-spacing-xs">
              <Search size={18} className="text-outline" />
              <span className="font-body-sm text-body-sm text-outline">Search clinical deck...</span>
            </div>
          </div>
          
          <button aria-label="Notifications" className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
            <Bell size={20} />
          </button>
          
          <div className="flex items-center gap-spacing-sm pl-spacing-xs">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">
                {currentUser ? currentUser.first_name[0] : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tertiary-container rounded-full ring-2 ring-surface-container-lowest"></span>
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-title-sm text-title-sm text-on-surface leading-tight">
                {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : ''}
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
