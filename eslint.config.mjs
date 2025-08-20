import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'

import globals from 'globals'


export default defineConfigWithVueTs([
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    ignores: ['dist', 'node_modules'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-types': [
        'error',
        {
          types: {
            '{}': false,
          },
          extendDefaults: true,
          allowObjectTypes: true,
        },
      ],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-dupe-keys': 'off',
    }
  },
])
