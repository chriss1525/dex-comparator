import './global.css';
// import type { Metadata } from 'next/server';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// export const metadata: Metadata = {
//   title: 'DEX Price Explorer',
//   description: 'A DEX price comparison tool',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
