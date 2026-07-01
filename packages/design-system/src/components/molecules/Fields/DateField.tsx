import { forwardRef } from 'react'
import { Field, type FieldProps } from './Field'

export type DateFieldProps = Omit<FieldProps, 'type'>

/** Pure-visual date field (e.g. birth date). */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  function DateField(props, ref) {
    return <Field ref={ref} type='date' autoComplete='bday' {...props} />
  }
)
