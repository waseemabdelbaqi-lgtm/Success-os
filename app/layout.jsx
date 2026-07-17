import './globals.css';
import './product.css';

export const metadata = {
  title: 'SUCCESS OS — طريقك نحو النجاح',
  description: 'نظام التعليم الذكي مدى الحياة من Success 4 Sure',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

