'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { supabase, supabaseUrl, Profile, Drone, AiAlert } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type Theme = 'dark' | 'light';
type Page =
  | 'dashboard'
  | 'camera'
  | 'drone-control'
  | 'ai-monitor'
  | 'gallery'
  | 'analytics'
  | 'sustainability'
  | 'settings';

interface AppContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  drones: Drone[];
  alerts: AiAlert[];
  unreadAlerts: number;
  theme: Theme;
  currentPage: Page;
  sidebarOpen: boolean;
  torchOn: boolean;
  torchBrightness: number;
  activeDrone: Drone | null;
  setTheme: (t: Theme) => void;
  setCurrentPage: (p: Page) => void;
  setSidebarOpen: (v: boolean) => void;
  setTorchOn: (v: boolean) => void;
  setTorchBrightness: (v: number) => void;
  setActiveDrone: (d: Drone | null) => void;
  markAlertRead: (id: string) => void;
  signOut: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user] = useState<User | null>({
    id: 'guest_user_id',
    email: 'farmer@soilguard.ai',
    user_metadata: { full_name: 'Guest Farmer' }
  } as any);
  const [session] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>({
    id: 'guest_user_id',
    full_name: 'Guest Farmer',
    role: 'Admin',
    avatar_url: '',
    farm_name: 'Green Valley Farm',
    created_at: new Date().toISOString()
  });
  const [drones, setDrones] = useState<Drone[]>([]);
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchBrightness, setTorchBrightness] = useState(80);
  const [activeDrone, setActiveDrone] = useState<Drone | null>(null);

  // Sync current page with URL
  useEffect(() => {
    const page = pathname?.split('/')[1] as Page;
    if (page && [
      'dashboard', 'camera', 'drone-control', 'ai-monitor', 
      'gallery', 'analytics', 'sustainability', 'settings'
    ].includes(page)) {
      setCurrentPage(page);
    } else if (pathname === '/') {
      setCurrentPage('dashboard');
    }
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setDrones([]);
      setAlerts([]);
      return;
    }

    (async () => {
      try {
        if (supabaseUrl.includes('placeholder')) return;

        const { data: p, error: pError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (p && !pError) setProfile(p);

        const { data: d, error: dError } = await supabase.from('drones').select('*').eq('user_id', user.id);
        if (d && !dError) {
          setDrones(d as Drone[]);
          if (d.length > 0) setActiveDrone(d[0] as Drone);
        }

        const { data: a, error: aError } = await supabase
          .from('ai_alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (a && !aError) setAlerts(a as AiAlert[]);
      } catch (err) {
        console.error('Failed to fetch data from Supabase:', err);
      }
    })();
  }, [user]);

  const unreadAlerts = alerts.filter(a => !a.is_read).length;

  const markAlertRead = async (id: string) => {
    await supabase.from('ai_alerts').update({ is_read: true }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const signOut = () => {
    // Mock signout
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      user, session, profile, drones, alerts, unreadAlerts,
      theme, currentPage, sidebarOpen, torchOn, torchBrightness, activeDrone,
      setTheme, setCurrentPage, setSidebarOpen,
      setTorchOn, setTorchBrightness, setActiveDrone,
      markAlertRead, signOut
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
