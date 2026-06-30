import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field } from './Field'

describe('Field', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(<Field label='First name' placeholder='Jane' />)
    const input = screen.getByLabelText('First name')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Jane')
  })

  it('uses a provided id over the generated one', () => {
    render(<Field label='Email' id='email-input' />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email-input')
  })

  it('renders an error with role="alert" and marks the input invalid', () => {
    render(<Field label='Email' error='Email is required' />)
    const input = screen.getByLabelText('Email')
    const alert = screen.getByRole('alert')

    expect(alert).toHaveTextContent('Email is required')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toBe(alert.id)
  })

  it('describes the input with helper text when there is no error', () => {
    render(<Field label='Password' description='At least 8 characters' />)
    const input = screen.getByLabelText('Password')
    const help = screen.getByText('At least 8 characters')
    expect(input.getAttribute('aria-describedby')).toBe(help.id)
  })

  it('prefers the error over the description for aria-describedby', () => {
    render(
      <Field
        label='Password'
        description='At least 8 characters'
        error='Too short'
      />
    )
    const input = screen.getByLabelText('Password')
    expect(screen.queryByText('At least 8 characters')).not.toBeInTheDocument()
    expect(input.getAttribute('aria-describedby')).toBe(
      screen.getByRole('alert').id
    )
  })

  it('forwards arbitrary input + aria attributes', () => {
    render(
      <Field label='Search' aria-label='Search override' name='q' required />
    )
    const input = screen.getByLabelText('Search override')
    expect(input).toHaveAttribute('name', 'q')
    expect(input).toBeRequired()
  })
})
