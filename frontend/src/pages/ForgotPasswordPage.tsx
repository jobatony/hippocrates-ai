import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api';
import { Loader2, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-md">
        <div className="w-full max-w-md text-center bg-surface-container rounded-2xl p-xl border border-outline-variant">
          <KeyRound size={48} className="text-primary mx-auto mb-md" />
          <h2 className="font-headline-md text-on-surface font-bold text-xl mb-sm">Check your email</h2>
          <p className="text-on-surface-variant text-label-md mb-lg">
            If <strong>{email}</strong> is registered, you'll receive a reset code shortly.
          </p>
          <button onClick={() => navigate('/reset-password', { state: { email } })}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md hover:bg-primary-container transition-all">
            Enter Reset Code
          </button>
          <Link to="/login" className="block mt-md text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Forgot password?</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            Enter your email and we'll send you a recovery code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Code'}
          </button>

          <Link to="/login" className="block text-center text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};
