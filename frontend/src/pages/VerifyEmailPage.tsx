import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resendVerification, setTokens, fetchMe } from '../api';
import { useStore } from '../store/useStore';
import { Loader2, MailCheck } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentUser = useStore(s => s.setCurrentUser);

  const emailFromState = (location.state as { email?: string })?.email || '';
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await verifyEmail(email, code);
      setTokens(data.access, data.refresh);
      const user = await fetchMe();
      setCurrentUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setError('Please enter your email.'); return; }
    setIsResending(true);
    setError(null);
    try {
      await resendVerification(email);
      setSuccess('A new code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <MailCheck size={48} className="text-primary mx-auto mb-md" />
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Check your email</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            We sent a 6-digit code to <strong>{email || 'your email'}</strong>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          {!emailFromState && (
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
          )}

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Verification Code</label>
            <input type="text" required maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary tracking-widest text-center text-xl" />
          </div>

          {error   && <p className="text-error text-label-sm">{error}</p>}
          {success && <p className="text-primary text-label-sm">{success}</p>}

          <button type="submit" disabled={isLoading || code.length !== 6}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify Email'}
          </button>

          <button type="button" onClick={handleResend} disabled={isResending}
            className="w-full text-label-sm text-on-surface-variant hover:text-primary transition-colors">
            {isResending ? 'Sending...' : "Didn't get a code? Resend"}
          </button>
        </form>
      </div>
    </div>
  );
};
