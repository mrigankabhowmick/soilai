import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '../context/AppContext';
import ClientShell from '../components/ClientShell';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SoilGuard AI — Smart Agriculture Drone Platform',
  description: 'Professional drone telemetry and agricultural analysis platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <ClientShell>{children}</ClientShell>
        </AppProvider>
      </body>
    </html>
  );
}
