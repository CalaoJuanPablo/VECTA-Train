import { Field, type FieldProps } from './Field';

export type DateFieldProps = Omit<FieldProps, 'type'>;

/** Pure-visual date field (e.g. birth date). */
export function DateField(props: DateFieldProps) {
  return <Field type="date" autoComplete="bday" {...props} />;
}
