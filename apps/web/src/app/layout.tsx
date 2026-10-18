import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import '@vecta/design-system/src/layers.css';
import '@vecta/design-system/src/reset.css';
import '@vecta/design-system/src/tokens.css';
import '@vecta/design-system/src/themes.css';
import ThemeScript from './theme-script';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--vt-font-ui',
  display: 'swap',
  adjustFontFallback: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--vt-font-mono',
  display: 'swap',
  adjustFontFallback: true,
});

export const metadata = { title: 'VECTA Train' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}