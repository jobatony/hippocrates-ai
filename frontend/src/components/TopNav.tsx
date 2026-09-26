import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setMode, logout } = useStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Clear any lingering text selection whenever the route changes.
  // This prevents the fixed FAB in DocumentRenderer from getting stuck
  // on top of the new page and blocking all pointer events.
  useEffect(() => {
    window.getSelection()?.removeAllRanges();
    // Also force-reset the cursor style on the body in case it got stuck
    document.body.style.cursor = '';
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate('/');
  };

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
          <Link to="/dashboard" className="flex flex-col hover:opacity-80 transition-opacity">
            <span className="font-title-md text-title-md text-on-surface tracking-tight leading-none font-bold text-xl">Hippocrates AI</span>
          </Link>
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

        {/* Right: Search + Avatar */}
        <div className="flex items-center gap-spacing-sm sm:gap-spacing-md shrink-0">
          
          {/* Search Bar (Mobile & Desktop) */}
          {location.pathname === '/library' && (
            <div className="flex items-center shrink min-w-0">
              <SearchBar />
            </div>
          )}

          {/* Avatar & Profile Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-spacing-sm pl-spacing-xs p-1 rounded-full hover:bg-surface-container transition-colors"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm">
                  {currentUser ? currentUser.first_name[0] : 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tertiary-container rounded-full ring-2 ring-surface-container-lowest"></span>
              </div>
              <div className="hidden xl:flex flex-col text-left pr-2">
                <span className="font-title-sm text-title-sm text-on-surface leading-tight">
                  {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : ''}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-outline-variant">
                  <p className="text-body-md font-bold text-on-surface truncate">
                    {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'User'}
                  </p>
                  <p className="text-body-sm text-on-surface-variant truncate">
                    {currentUser?.email || ''}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors text-left"
                  >
                    <LogOut size={18} />
                    <span className="font-title-sm">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
