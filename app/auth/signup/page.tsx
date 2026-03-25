'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@/lib/api';
import Navigation from '@/components/Navigation';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
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
      const response = await signup(formData);

      console.log('Signup response:', response);
      console.log('Token stored:', localStorage.getItem('krew_token'));

      // Store user info
      localStorage.setItem('user_info', JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name,
        business_name: formData.business_name,
        email: formData.email
      }));

      // Redirect to onboarding (with slight delay)
      setTimeout(() => {
        router.push('/onboarding');
      }, 500);
    } catch (err: any) {
      // Error message is already user-friendly from apiRequest
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
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
            Create your account
          </h1>
          <p className="text-[0.72rem] text-text-tertiary mb-6">
            Start your journey with Krew
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-[0.6rem] mb-3">
              <div className="flex-1">
                <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem] block">
                  First name
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-[9px] text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                  placeholder="John"
                />
              </div>
              <div className="flex-1">
                <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem] block">
                  Last name
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-[9px] text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem] block">
                Business Name
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-[9px] text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                placeholder="Your Brand Name"
              />
            </div>

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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="text-center text-[0.7rem] text-text-tertiary mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-text-secondary hover:text-text-primary cursor-pointer">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}