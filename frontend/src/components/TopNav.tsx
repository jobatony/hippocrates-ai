import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Settings, ChevronLeft, Loader2, Shield, UploadCloud, CheckSquare, ExternalLink, ArrowRight, BookOpen, LayoutDashboard, BrainCircuit, Database } from 'lucide-react';
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

  const getNavLinks = () => {
    if (location.pathname.startsWith('/data-entry')) {
      const links = [];
      if (currentUser?.is_superuser || currentUser?.is_staff) {
        links.push({ label: 'Admin', path: '/data-entry/admin' });
      }
      if (currentUser?.groups?.includes('Uploader')) {
        links.push({ label: 'Upload', path: '/data-entry/upload' });
      }
      if (currentUser?.groups?.includes('Validator')) {
        links.push({ label: 'Validate', path: '/data-entry/validate' });
      }
      // Add a link to return to the main app
      links.push({ label: 'Exit Portal', path: '/dashboard' });
      return links;
    }

    return [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Library',   path: '/library', onClick: () => setMode('read') },
      { label: 'Quiz',      path: '/quiz' },
    ];
  };

  const navLinks = getNavLinks();
  
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
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container rounded-2xl shadow-xl border border-outline-variant overflow-hidden z-50">
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
                    <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-high/40">
                      <p className="text-body-md font-bold text-on-surface truncate">
                        {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'User'}
                      </p>
                      <p className="text-body-sm text-on-surface-variant truncate">
                        {currentUser?.email || ''}
                      </p>
                    </div>

                    <div className="p-2 flex flex-col gap-1">
                      {/* If inside Data Entry: Show portal links */}
                      {location.pathname.startsWith('/data-entry') ? (
                        <>
                          <div className="px-2 py-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant/70">
                            Data Entry Portals
                          </div>
                          {(currentUser?.is_superuser || currentUser?.is_staff) && (
                            <Link
                              to="/data-entry/admin"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-colors ${
                                location.pathname === '/data-entry/admin'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'text-on-surface hover:bg-surface-container-high'
                              }`}
                            >
                              <Shield size={16} className="text-primary" />
                              <span>Admin</span>
                            </Link>
                          )}
                          {currentUser?.groups?.includes('Uploader') && (
                            <Link
                              to="/data-entry/upload"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-colors ${
                                location.pathname === '/data-entry/upload'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'text-on-surface hover:bg-surface-container-high'
                              }`}
                            >
                              <UploadCloud size={16} className="text-primary" />
                              <span>Upload</span>
                            </Link>
                          )}
                          {currentUser?.groups?.includes('Validator') && (
                            <Link
                              to="/data-entry/validate"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-colors ${
                                location.pathname === '/data-entry/validate'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'text-on-surface hover:bg-surface-container-high'
                              }`}
                            >
                              <CheckSquare size={16} className="text-primary" />
                              <span>Validate</span>
                            </Link>
                          )}
                          
                          <hr className="my-1 border-outline-variant" />
                          
                          <Link
                            to="/dashboard"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                          >
                            <ExternalLink size={16} className="text-secondary" />
                            <span>Exit to Main App</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          {/* Mobile Main Navigation Links (when desktop nav is hidden) */}
                          <div className="lg:hidden flex flex-col gap-1">
                            <div className="px-2 py-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant/70">
                              Navigation
                            </div>
                            <Link
                              to="/dashboard"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-colors ${
                                location.pathname === '/dashboard'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'text-on-surface hover:bg-surface-container-high'
                              }`}
                            >
                              <LayoutDashboard size={16} className="text-primary" />
                              <span>Dashboard</span>
                            </Link>
                            <Link
                              to="/library"
                              onClick={() => { setMode('read'); setIsProfileMenuOpen(false); }}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-colors ${
                                location.pathname === '/library'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'text-on-surface hover:bg-surface-container-high'
                              }`}
                            >
                              <BookOpen size={16} className="text-primary" />
                              <span>Library</span>
                            </Link>
                            <Link
                              to="/quiz"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-colors ${
                                location.pathname === '/quiz'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'text-on-surface hover:bg-surface-container-high'
                              }`}
                            >
                              <BrainCircuit size={16} className="text-primary" />
                              <span>Quiz</span>
                            </Link>
                            <hr className="my-1 border-outline-variant" />
                          </div>

                          {/* Shortcut to Data Entry Portal if user has roles */}
                          {(currentUser?.is_superuser || currentUser?.is_staff || currentUser?.groups?.includes('Uploader') || currentUser?.groups?.includes('Validator')) && (
                            <>
                              <Link
                                to="/data-entry"
                                onClick={() => setIsProfileMenuOpen(false)}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-body-sm font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Database size={16} />
                                  <span>Data Entry Portal</span>
                                </div>
                                <ArrowRight size={14} />
                              </Link>
                              <hr className="my-1 border-outline-variant" />
                            </>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-on-surface hover:bg-surface-container-high rounded-xl transition-colors text-left text-body-sm font-medium"
                      >
                        <Settings size={16} className="text-primary" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-error hover:bg-error-container hover:text-on-error-container rounded-xl transition-colors text-left font-title-sm mt-0.5"
                      >
                        <LogOut size={16} />
                        <span>Log out</span>
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
