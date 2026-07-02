import { Field, type FieldProps } from './Field';

export type TextFieldProps = Omit<FieldProps, 'type'>;

/** Pure-visual single-line text field (e.g. first / last name). */
export function TextField(props: TextFieldProps) {
  return <Field type="text" {...props} />;
}
