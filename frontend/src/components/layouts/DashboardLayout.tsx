'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  navItems: Array<{
    href: string;
    label: string;
    icon?: string;
  }>;
}

export default function DashboardLayout({ 
  children, 
  title, 
  navItems 
}: DashboardLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => 
    pathname?.startsWith(href) ? "bg-orange-50 text-orange-700" : "hover:bg-gray-50";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white">
          <div className="px-4 py-4 text-xl font-bold text-gray-900">
            {title}
          </div>
          <nav className="px-2 py-2 space-y-1 text-sm text-gray-700">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 ${isActive(item.href)}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
