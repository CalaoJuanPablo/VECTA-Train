import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

/** Pure-visual button. Carries no form logic; pass native `type`/`onClick`/`disabled`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', fullWidth, className, type = 'button', ...rest },
  ref,
) {
  const cls = [styles.button, styles[variant], fullWidth ? styles.fullWidth : null, className]
    .filter(Boolean)
    .join(' ');
  return <button ref={ref} type={type} className={cls} {...rest} />;
});
