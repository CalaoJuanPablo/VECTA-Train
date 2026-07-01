import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextLink } from './TextLink'

describe('TextLink', () => {
  it('renders an anchor by default', () => {
    render(<TextLink href='/forgot'>Forgot password?</TextLink>)
    expect(
      screen.getByRole('link', { name: 'Forgot password?' })
    ).toHaveAttribute('href', '/forgot')
  })

  it('renders a button when as="button"', () => {
    render(
      <TextLink as='button' onClick={() => {}}>
        Create account
      </TextLink>
    )
    expect(
      screen.getByRole('button', { name: 'Create account' })
    ).toHaveAttribute('type', 'button')
  })
})
