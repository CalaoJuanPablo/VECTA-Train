import type { ButtonHTMLAttributes } from 'react';
import cx from 'classnames';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

/** Pure-visual button. Carries no form logic; pass native `type`/`onClick`/`disabled`. */
export function Button({
  variant = 'primary',
  fullWidth,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], { [styles.fullWidth]: fullWidth }, className)}
      {...rest}
    />
  );
}
