import { useState } from 'react';
import { Field, type FieldProps } from './Field';
import styles from './PasswordField.module.css';

export interface PasswordFieldProps extends Omit<FieldProps, 'type' | 'endAdornment'> {
  /** Use the `new-password` autocomplete hint (sign-up) instead of `current-password`. */
  newPassword?: boolean;
  /** Accessible label for the toggle when the password is hidden. */
  showPasswordLabel?: string;
  /** Accessible label for the toggle when the password is visible. */
  hidePasswordLabel?: string;
}

/**
 * Pure-visual password field. Includes a show/hide toggle whose only state is local
 * UI visibility — it carries no form logic or value handling.
 */
export function PasswordField({
  newPassword,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  autoComplete,
  disabled,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const toggle = (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setVisible((v) => !v)}
      aria-pressed={visible}
      aria-label={visible ? hidePasswordLabel : showPasswordLabel}
      disabled={disabled}
    >
      {visible ? 'Hide' : 'Show'}
    </button>
  );

  return (
    <Field
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete ?? (newPassword ? 'new-password' : 'current-password')}
      endAdornment={toggle}
      disabled={disabled}
      {...props}
    />
  );
}
