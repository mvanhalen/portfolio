import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });



export const metadata: Metadata = {
  title: 'Martijn van Halen - Portfolio',
  description: 'Full-stack engineer and technical founder with over 20 years of experience in SaaS, crypto, and fintech.',
  keywords: 'Martijn van Halen, full-stack, SaaS, crypto, fintech, mobile apps, cloud',
  openGraph: {
    title: 'Martijn van Halen - Portfolio',
    description: 'Full-stack engineer and technical founder with extensive experience.',
    url: 'https://mvanhalen.eu',
    siteName: 'Martijn van Halen Portfolio',
    locale: 'en_US',
    type: 'website'
  }
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}