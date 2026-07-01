import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('renders a text input and passes value/onChange through', () => {
    render(<TextField label='First name' value='Jane' onChange={() => {}} />)
    const input = screen.getByLabelText<HTMLInputElement>('First name')
    expect(input).toHaveAttribute('type', 'text')
    expect(input.value).toBe('Jane')
  })
})
