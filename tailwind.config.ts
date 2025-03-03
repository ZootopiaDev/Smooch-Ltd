import type {Config} from 'tailwindcss';

export default {
  content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system'],
      },
      fontSize: {
        base: ['11px', '13.31px'],
        md: ['14px', '16.94px'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#000',
            fontSize: '11px',
            lineHeight: '13.31px',
            maxWidth: '583px',
          },
        },
        md: {
          css: {
            color: '#000',
            fontSize: '14px',
            lineHeight: '16.94px',
            maxWidth: '583px',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
