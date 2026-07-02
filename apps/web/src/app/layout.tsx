import '@vecta/design-system/src/layers.css';
import '@vecta/design-system/src/reset.css';
import '@vecta/design-system/src/tokens.css';
import '@vecta/design-system/src/themes.css';
import type { ReactNode } from 'react';
import ThemeScript from './theme-script';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = { title: 'VECTA Train' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
