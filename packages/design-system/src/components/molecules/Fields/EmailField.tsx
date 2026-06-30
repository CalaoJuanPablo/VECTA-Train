import { forwardRef } from 'react'
import { Field, type FieldProps } from './Field'

export type EmailFieldProps = Omit<FieldProps, 'type'>

/** Pure-visual email field with email keyboard / autofill defaults. */
export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(
  function EmailField(props, ref) {
    return (
      <Field
        ref={ref}
        type='email'
        inputMode='email'
        autoComplete='email'
        {...props}
      />
    )
  }
)
