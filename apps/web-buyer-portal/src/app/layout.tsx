import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'FieldForge Enterprise | Autonomous Dispatch & SOW Studio',
  description:
    'Real-time technician matching, cryptographic SLA enforcement, and automated escrow settlement.',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
