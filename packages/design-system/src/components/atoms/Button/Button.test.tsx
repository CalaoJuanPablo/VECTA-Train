import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('defaults to a non-submitting button and applies variant', () => {
    render(<Button>Continue</Button>)
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveAttribute(
      'type',
      'button'
    )
  })

  it('honors an explicit submit type and disabled state', () => {
    render(
      <Button type='submit' disabled>
        Sign in
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Sign in' })
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toBeDisabled()
  })
})
