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
    <html lang="en">
      <body className="min-h-screen bg-[#F7F9F5] text-[#0B1114] font-sans antialiased selection:bg-[#A8F22D] selection:text-[#08120D]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
