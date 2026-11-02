import Script from 'next/script';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { env } from '@/lib/env';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-display', display: 'swap' });

export const metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${env.NEXT_PUBLIC_SITE_NAME} — Multi-Vendor Marketplace`,
    template: `%s | ${env.NEXT_PUBLIC_SITE_NAME}`,
  },
  description: 'A bold, premium marketplace where independent vendors sell with the polish of a flagship brand.',
  openGraph: { type: 'website', siteName: env.NEXT_PUBLIC_SITE_NAME },
};

export const viewport = { themeColor: '#0A0A0A', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <Providers>
          <Header />
          <main id="main" className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
        {env.NEXT_PUBLIC_ANALYTICS_DOMAIN ? (
          <Script defer data-domain={env.NEXT_PUBLIC_ANALYTICS_DOMAIN} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}