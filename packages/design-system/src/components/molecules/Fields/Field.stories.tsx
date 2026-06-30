import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from './Field'

const meta = {
  title: 'Molecules/Fields/Field',
  component: Field,
  tags: ['autodocs'],
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
  },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Required: Story = {
  args: { required: true },
}

export const WithDescription: Story = {
  args: { description: 'We never share this with anyone.' },
}

export const WithError: Story = {
  args: { error: 'This field is required' },
}

export const Disabled: Story = {
  args: { disabled: true },
}
