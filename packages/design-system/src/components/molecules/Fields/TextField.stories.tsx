import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextField } from './TextField'

const meta = {
  title: 'Molecules/Fields/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: 'First name',
    placeholder: 'Jane',
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Required: Story = {
  args: { required: true },
}

export const WithError: Story = {
  args: { error: 'First name is required' },
}
