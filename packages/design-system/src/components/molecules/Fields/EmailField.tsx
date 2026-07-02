import { Field, type FieldProps } from './Field';

export type EmailFieldProps = Omit<FieldProps, 'type'>;

/** Pure-visual email field with email keyboard / autofill defaults. */
export function EmailField(props: EmailFieldProps) {
  return <Field type="email" inputMode="email" autoComplete="email" {...props} />;
}
