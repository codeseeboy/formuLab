'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS } from '@/lib/constants';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import {
  LayoutDashboard,
  FlaskConical,
  Atom,
  Bug,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  FlaskConical: <FlaskConical size={20} />,
  Atom: <Atom size={20} />,
  Bug: <Bug size={20} />,
  FileText: <FileText size={20} />,
  BookOpen: <BookOpen size={20} />,
  Settings: <Settings size={20} />,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}>
        <div className="spinner spinner-lg" />
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Loading FormuLab...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <div className="sidebar-logo-text">
            Formu<span>Lab</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`sidebar-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-nav-icon">{iconMap[item.icon]}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={handleLogout}>
            <span className="sidebar-nav-icon"><LogOut size={20} /></span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none' }}
            id="mobile-menu-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <style>{`
            @media (max-width: 768px) {
              #mobile-menu-toggle { display: flex !important; }
            }
          `}</style>
          <div>
            <div className="topbar-title">
              {org?.name || 'My Workspace'}
            </div>
          </div>
        </div>

        <div className="topbar-actions">
          <div style={{ position: 'relative' }}>
            <div
              className="topbar-user"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="topbar-avatar">
                {user?.name ? getInitials(user.name) : '?'}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user?.name || 'User'}</span>
                <span className="topbar-user-role">Scientist</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
            </div>

            {userMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                  onClick={() => setUserMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 200,
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 51,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease-out',
                }}>
                  <Link
                    href="/settings"
                    className="sidebar-nav-item"
                    onClick={() => setUserMenuOpen(false)}
                    style={{ borderRadius: 0 }}
                  >
                    <Settings size={16} /> Settings
                  </Link>
                  <button
                    className="sidebar-nav-item"
                    onClick={handleLogout}
                    style={{ borderRadius: 0, color: 'var(--color-danger)' }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-bg-overlay)',
            zIndex: 99,
            display: 'none',
          }}
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay { display: block !important; }
        }
      `}</style>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-content">
          {children}
        </div>
      </main>
      <LegalDisclaimer />
    </div>
  );
}
