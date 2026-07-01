import type { Meta, StoryObj } from '@storybook/react-vite'
import { PasswordField } from './PasswordField'

const meta = {
  title: 'Molecules/Fields/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  args: {
    label: 'Password',
    placeholder: 'Your password',
  },
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NewPassword: Story = {
  args: {
    newPassword: true,
    description: 'At least 8 characters, including a number',
  },
}

export const WithError: Story = {
  args: { error: 'Password must be at least 8 characters' },
}
