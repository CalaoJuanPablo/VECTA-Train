import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmailField } from './EmailField'

describe('EmailField', () => {
  it('sets email type and autofill hints', () => {
    render(<EmailField label='Email' />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('inputmode', 'email')
    expect(input).toHaveAttribute('autocomplete', 'email')
  })
})
