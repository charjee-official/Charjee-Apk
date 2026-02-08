import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'EV Admin Control',
  description: 'EV charging platform admin panel',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
