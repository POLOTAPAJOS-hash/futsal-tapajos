import type {Metadata} from 'next';
import { DM_Sans, Bebas_Neue, DM_Mono } from 'next/font/google';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: 'Sistema Digital FEFUSPA — Súmula Online',
  description: 'Sistema Digital para gestão de súmulas online nos padrões CBFS',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body className={`${bebasNeue.variable} ${dmSans.variable} ${dmMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
