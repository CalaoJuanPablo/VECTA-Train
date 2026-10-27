import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from './router';

// Each test builds its own in-memory router at the URL it wants, so tests
// never share the app's browser router or each other's location.
const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe('routes', () => {
  it('renders the not-found page for an unknown path', () => {
    renderAt('/this-page-does-not-exist');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('renders the home page at "/"', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Welcome to VECTA Train' })).toBeInTheDocument();
  });
});
