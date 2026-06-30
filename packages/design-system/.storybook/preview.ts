import type { Preview } from '@storybook/react-vite'

// Global design-system styles so components render with their tokens/themes.
import '../src/layers.css'
import '../src/reset.css'
import '../src/tokens.css'
import '../src/themes.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
}

export default preview
