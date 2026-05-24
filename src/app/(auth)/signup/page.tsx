'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name, orgName);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="auth-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="sidebar-logo-icon" style={{ width: 64, height: 64, fontSize: '2rem', marginBottom: '1.5rem' }}>F</div>
        <h1 className="auth-brand-title">
          Start with <span style={{ color: 'var(--color-brand)' }}>FormuLab</span>
        </h1>
        <p className="auth-brand-subtitle">
          Create your workspace and start building smarter formulations with AI assistance.
          Free to start, no credit card required.
        </p>
      </div>

      <div className="auth-form-container">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-form-title">Create Account</h2>
          <p className="auth-form-subtitle">Set up your profile and organization</p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-danger)',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="auth-form-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                <User size={14} /> Full Name
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Dr. Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                suppressHydrationWarning
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <Mail size={14} /> Work Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="jane@agrochem.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                suppressHydrationWarning
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <Lock size={14} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ paddingRight: '2.5rem' }}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="form-hint">Must be at least 8 characters</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="orgName">
                <Building2 size={14} /> Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                className="form-input"
                placeholder="Agrochem Labs Inc."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                suppressHydrationWarning
              />
              <span className="form-hint">Your company or lab name. You can invite team members later.</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
            style={{ justifyContent: 'center' }}
            suppressHydrationWarning
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Creating account...
              </>
            ) : 'Create Account'}
          </button>

          <p className="auth-form-footer">
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
