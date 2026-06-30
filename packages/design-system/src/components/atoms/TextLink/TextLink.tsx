import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import styles from './TextLink.module.css';

export type TextLinkProps =
  | ({ as: 'button' } & ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as?: 'a' } & AnchorHTMLAttributes<HTMLAnchorElement>);

/**
 * Pure-visual inline text link. Renders an anchor for navigation (e.g. "Forgot
 * password?") or, with `as="button"`, a button for in-page actions (e.g. mode toggle).
 */
export function TextLink(props: TextLinkProps) {
  if (props.as === 'button') {
    const { as: _as, className, type, ...rest } = props;
    return (
      <button
        type={type ?? 'button'}
        className={[styles.link, className].filter(Boolean).join(' ')}
        {...rest}
      />
    );
  }
  const { as: _as, className, ...rest } = props;
  return <a className={[styles.link, className].filter(Boolean).join(' ')} {...rest} />;
}
