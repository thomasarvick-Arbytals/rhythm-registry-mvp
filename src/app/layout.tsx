import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rhythm Registry',
  description: 'Rhythm Registry — event DJ mix registry and workflow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
