import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the home page at "/"', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Welcome to VECTA Train' })).toBeInTheDocument();
  });
});
