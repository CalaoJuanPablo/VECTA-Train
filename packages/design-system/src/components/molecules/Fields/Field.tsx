import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Field.module.css';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible field label, associated with the input via `htmlFor`. */
  label: string;
  /** Error message. When set, the field renders invalid and exposes `role="alert"`. */
  error?: string;
  /** Helper text shown below the input when there is no error. */
  description?: string;
  /** Renders a required marker and sets `required` / `aria-required`. */
  required?: boolean;
  /** Optional element rendered inside the input on the trailing edge (e.g. a toggle button). */
  endAdornment?: ReactNode;
}

/**
 * Internal, purely-visual form field shell. Owns the label/input/help/error markup
 * and all ARIA wiring (id association, aria-invalid, aria-describedby, error alert).
 * Holds no form logic — values, errors and validation are supplied by the consumer.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, description, required, endAdornment, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;

  const showDescription = Boolean(description) && !error;
  const describedBy =
    [showDescription ? descriptionId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const inputClassName = [styles.input, error ? styles.inputInvalid : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <label
        className={[styles.label, required ? styles.labelRequired : null].filter(Boolean).join(' ')}
        htmlFor={inputId}
      >
        {label}
      </label>

      <div className={styles.control}>
        <input
          ref={ref}
          id={inputId}
          className={inputClassName}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {endAdornment ? <div className={styles.adornment}>{endAdornment}</div> : null}
      </div>

      {showDescription ? (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
