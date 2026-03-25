'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, getUserInfo } from '@/lib/api';
import Navigation from '@/components/Navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);

      console.log('Login response:', response);
      console.log('Token stored:', localStorage.getItem('krew_token'));

      // Store user info from response or use fallback
      if (response.user) {
        localStorage.setItem('user_info', JSON.stringify(response.user));
      } else {
        // Fallback if no user data in response
        localStorage.setItem('user_info', JSON.stringify({
          email: formData.email,
          first_name: 'User',
          last_name: ''
        }));
      }

      // Redirect to dashboard (with slight delay to ensure state updates)
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      // Error message is already user-friendly from apiRequest
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen flex items-center justify-center px-4 pt-12">
        <div className="bg-background2 border border-border-md rounded-[14px] p-8 w-full max-w-[340px]">
          <h1 className="text-[1.1rem] font-light tracking-[-0.025em] text-text-primary mb-1">
            Welcome back
          </h1>
          <p className="text-[0.72rem] text-text-tertiary mb-6">
            Log in to your Krew account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem] block">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-[9px] text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                placeholder="john@example.com"
              />
            </div>

            <div className="mb-4">
              <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem] block">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-[9px] text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-[0.72rem] mb-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-btn-bg text-btn-text rounded-[8px] py-[10px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="text-center text-[0.7rem] text-text-tertiary mt-4">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-text-secondary hover:text-text-primary cursor-pointer">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}