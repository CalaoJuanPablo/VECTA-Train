import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateField } from './DateField'

const meta = {
  title: 'Molecules/Fields/DateField',
  component: DateField,
  tags: ['autodocs'],
  args: {
    label: 'Birth date',
  },
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Required: Story = {
  args: { required: true },
}

export const WithError: Story = {
  args: { error: 'Birth date is required' },
}
