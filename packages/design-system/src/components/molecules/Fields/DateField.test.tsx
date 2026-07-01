import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DateField } from './DateField'

describe('DateField', () => {
  it('renders a date input', () => {
    render(<DateField label='Birth date' />)
    expect(screen.getByLabelText('Birth date')).toHaveAttribute('type', 'date')
  })
})
