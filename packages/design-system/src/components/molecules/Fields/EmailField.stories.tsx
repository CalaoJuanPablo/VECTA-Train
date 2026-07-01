import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmailField } from './EmailField'

const meta = {
  title: 'Molecules/Fields/EmailField',
  component: EmailField,
  tags: ['autodocs'],
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
  },
} satisfies Meta<typeof EmailField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Required: Story = {
  args: { required: true },
}

export const WithError: Story = {
  args: { error: 'Enter a valid email address' },
}
