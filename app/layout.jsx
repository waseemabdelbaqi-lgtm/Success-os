import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';
import './product.css';
import './cursor-tailwind.css';
import './phase11.css';
import './success-os-theme.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-sos-display',
});

const body = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sos-body',
});

export const metadata = {
  title: {
    default: 'SUCCESS OS — طريقك نحو النجاح',
    template: '%s | SUCCESS OS',
  },
  description: 'نظام التعليم الذكي مدى الحياة من Success 4 Sure',
  applicationName: 'SUCCESS OS',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
};

export const viewport = {
  themeColor: '#4b0a11',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
