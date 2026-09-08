import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, setTokens } from '../api';
import { useStore } from '../store/useStore';
import { Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentUser = useStore(s => s.setCurrentUser);

  const successMessage = (location.state as { message?: string })?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      setTokens(data.access, data.refresh);
      setCurrentUser(data.user);
      navigate('/');
    } catch (err: any) {
      if (err.message?.includes('verify your email')) {
        navigate('/verify-email', { state: { email } });
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Welcome back</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">Sign in to continue to Hippocrates AI.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          {successMessage && <p className="text-primary text-label-sm bg-primary/10 px-md py-sm rounded-lg">{successMessage}</p>}

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-label-sm text-primary hover:underline">Forgot password?</Link>
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          <p className="text-center text-label-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
