import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { queryClient } from './utils/trpc';

// Typography must load before reset.css so the @font-face rules are
// registered before any rule names the families.
import './ui/typography.css';
// The token, theme and reset layers ship in this order; components only consume
// the variables they declare.
import './ui/reset.css';
import './ui/tokens.css';
import './ui/themes.css';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
