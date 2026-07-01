import '@vecta/design-system/src/layers.css';
import '@vecta/design-system/src/reset.css';
import '@vecta/design-system/src/tokens.css';
import '@vecta/design-system/src/themes.css';
import type { ReactNode } from 'react';
import ThemeScript from './theme-script';

export const metadata = { title: 'VECTA Train' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
