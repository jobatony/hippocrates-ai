import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Settings, ChevronLeft, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { updateUserSettings } from '../api';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, setMode, logout } = useStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quizRatio, setQuizRatio] = useState(currentUser?.quiz_ratio || 4);
  const [savingSettings, setSavingSettings] = useState(false);
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
    if (currentUser?.quiz_ratio) {
      setQuizRatio(currentUser.quiz_ratio);
    }
  }, [currentUser?.quiz_ratio]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
        setIsSettingsOpen(false); // reset on close
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updatedUser = await updateUserSettings({ quiz_ratio: quizRatio });
      setCurrentUser(updatedUser);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

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
      <div className="h-20 w-full px-4 md:px-spacing-xl flex items-center justify-between gap-2 md:gap-spacing-lg max-w-7xl mx-auto">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2 md:gap-spacing-md shrink-0 min-w-0">
          <Link to="/dashboard" className="flex flex-col hover:opacity-80 transition-opacity min-w-0">
            <span className="font-title-md text-title-md text-on-surface tracking-tight leading-none font-bold text-base sm:text-lg md:text-xl truncate">Hippocrates AI</span>
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
        <div className="flex items-center gap-2 sm:gap-spacing-md shrink min-w-0">
          
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
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50">
                {isSettingsOpen ? (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4 text-on-surface">
                      <button onClick={() => setIsSettingsOpen(false)} className="hover:bg-surface-variant p-1 rounded">
                        <ChevronLeft size={18} />
                      </button>
                      <span className="font-title-md">Settings</span>
                    </div>
                    
                    <label className="block text-label-sm text-on-surface-variant mb-2">
                      Review Cards per New Card
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" max="6" 
                        value={quizRatio} 
                        onChange={e => setQuizRatio(Number(e.target.value))} 
                        className="flex-1 accent-primary" 
                      />
                      <span className="font-title-lg text-primary">{quizRatio}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-2 mb-4">
                      Ratio: 1 New to {quizRatio} Review{quizRatio > 1 ? 's' : ''}
                    </p>
                
                    <button 
                      onClick={handleSaveSettings} 
                      disabled={savingSettings}
                      className="w-full bg-primary text-on-primary py-2 rounded-lg font-title-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
                    >
                      {savingSettings ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-outline-variant">
                      <p className="text-body-md font-bold text-on-surface truncate">
                        {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'User'}
                      </p>
                      <p className="text-body-sm text-on-surface-variant truncate">
                        {currentUser?.email || ''}
                      </p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-on-surface hover:bg-surface-variant rounded-lg transition-colors text-left"
                      >
                        <Settings size={18} />
                        <span className="font-title-sm">Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors text-left"
                      >
                        <LogOut size={18} />
                        <span className="font-title-sm">Log out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
