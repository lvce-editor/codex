import { defineConfig } from 'eslint/config'
import * as config from '@lvce-editor/eslint-config'

export default defineConfig([
  ...config.default,
  ...config.recommendedRegex,
  ...config.recommendedTsconfig,
  ...config.recommendedActions,
  {
    rules: {
      'github-actions/ci-versions': 'off',
      'github-actions/action-versions': 'off',
      'sonarjs/void-use': 'off',
    },
  },
])
