import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Continue',
    variant: 'primary',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary' },
}

export const FullWidth: Story = {
  args: { fullWidth: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}
