import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('hides the value by default and toggles visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAccessibleName('Hide password');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('uses new-password autocomplete when newPassword is set', () => {
    render(<PasswordField label="Password" newPassword />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('defaults to current-password autocomplete', () => {
    render(<PasswordField label="Password" />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });
});
