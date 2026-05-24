'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FlaskConical, Atom, BookOpen, Settings } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/formulations', label: 'Formulas', icon: FlaskConical },
  { href: '/ingredients', label: 'Chemicals', icon: Atom },
  { href: '/knowledge', label: 'Help', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-nav-item${active ? ' active' : ''}`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
