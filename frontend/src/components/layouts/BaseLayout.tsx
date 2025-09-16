'use client';

import { ReactNode } from 'react';
import { Footer, NavBar } from '../index';

interface BaseLayoutProps {
  children: ReactNode;
  showNavBar?: boolean;
  showFooter?: boolean;
}

export default function BaseLayout({ 
  children, 
  showNavBar = true, 
  showFooter = true 
}: BaseLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {showNavBar && <NavBar />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
