import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      '.next_old*/**',
      'node_modules/**',
      'node_modules_old/**',
      '.npm-cache/**',
    ],
  },
  {
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
