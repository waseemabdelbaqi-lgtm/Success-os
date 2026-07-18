import { Inter, Poppins } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';
import './product.css';
import './cursor-tailwind.css';
import './phase11.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
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
    <html lang="ar" dir="rtl" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
