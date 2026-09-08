import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword } from '../api';
import { Loader2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [form, setForm] = useState({ email: emailFromState, code: '', password: '', password2: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(form);
      navigate('/login', { state: { message: 'Password reset successfully! Please log in.' } });
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Reset your password</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            Enter the code from your email and choose a new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          {!emailFromState && (
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="your@email.com"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
          )}

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Reset Code</label>
            <input type="text" name="code" required maxLength={6}
              value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
              placeholder="000000"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary tracking-widest text-center text-xl" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">New Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Confirm New Password</label>
            <input type="password" name="password2" required value={form.password2} onChange={handleChange}
              placeholder="Repeat new password"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading || form.code.length !== 6}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
          </button>

          <Link to="/login" className="block text-center text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};
