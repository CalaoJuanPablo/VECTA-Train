import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextLink } from './TextLink'

const meta = {
  title: 'Atoms/TextLink',
  component: TextLink,
  tags: ['autodocs'],
} satisfies Meta<typeof TextLink>

export default meta
type Story = StoryObj<typeof meta>

export const Anchor: Story = {
  args: {
    href: '/forgot-password',
    children: 'Forgot password?',
  },
}

export const ButtonAction: Story = {
  args: {
    as: 'button',
    children: 'Create account',
  },
}
