import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas-claims-sop-demo.fey-sole-0181.chatgpt.site'),
  title: 'Atlas Claims | Secure Support Demo',
  description: 'A guarded insurance claims support workflow with deterministic identity verification.',
  openGraph: {
    title: 'Atlas Claims | Secure Support Demo',
    description: 'Secure support. Every step protected.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Atlas Claims secure four-phase workflow' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlas Claims | Secure Support Demo',
    description: 'Secure support. Every step protected.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
