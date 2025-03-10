import { includeIgnoreFile } from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'new-cap': 'off',
      'no-new': 'off',
      'no-warning-comments': 'off',
      'unicorn/no-array-reduce': 'off',
      // Turn off to support Node 18. You can remove this rule if you don't need to support Node 18.
      'unicorn/prefer-module': 'off'
    }
  }
]
