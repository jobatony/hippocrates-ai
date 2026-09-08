import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', password2: '',
  });
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
      await register(form);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        const messages = Object.values(parsed).flat();
        setError((messages as string[]).join(' '));
      } catch {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="font-headline-md text-on-surface font-bold text-2xl">Create your account</h1>
          <p className="text-on-surface-variant text-label-md mt-xs">
            Join Hippocrates AI to start learning smarter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container rounded-2xl p-xl space-y-md shadow-sm border border-outline-variant">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">First Name</label>
              <input type="text" name="first_name" required value={form.first_name} onChange={handleChange}
                placeholder="John"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-xs">Last Name</label>
              <input type="text" name="last_name" required value={form.last_name} onChange={handleChange}
                placeholder="Doe"
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              placeholder="john@example.com"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              placeholder="Min. 8 characters"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-label-sm text-on-surface-variant mb-xs">Confirm Password</label>
            <input type="password" name="password2" required value={form.password2} onChange={handleChange}
              placeholder="Repeat your password"
              className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>

          {error && <p className="text-error text-label-sm">{error}</p>}

          <button type="submit" disabled={isLoading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md flex items-center justify-center gap-sm disabled:opacity-50 hover:bg-primary-container transition-all">
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
          </button>

          <p className="text-center text-label-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
