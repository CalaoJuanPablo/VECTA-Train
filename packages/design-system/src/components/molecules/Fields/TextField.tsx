import { forwardRef } from 'react';
import { Field, type FieldProps } from './Field';

export type TextFieldProps = Omit<FieldProps, 'type'>;

/** Pure-visual single-line text field (e.g. first / last name). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  props,
  ref,
) {
  return <Field ref={ref} type="text" {...props} />;
});
