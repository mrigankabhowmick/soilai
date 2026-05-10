'use client';

import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, theme } = useApp();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <Sidebar />
      <div
        className="transition-all duration-300 flex flex-col min-h-screen"
        style={{ marginLeft: sidebarOpen ? 256 : 64 }}
      >
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
