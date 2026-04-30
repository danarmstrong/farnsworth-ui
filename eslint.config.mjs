import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/ignores',
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/target/**',
      '**/.idea/**',
      '**/*.min.*',
      '**/*.log',
      '**/*.class',
      '**/*.jar',
      '**/*.war',
      '**/*.app',
      '**/*.exe',
      '**/*.pyc',
      '**/*.pyo',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.mp4',
      '**/*.tiff',
      '**/*.avi',
      '**/*.flv',
      '**/*.mov',
      '**/*.wmv',
    ],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    rules: {
      'comma-dangle': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      'vue/block-lang': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  skipFormatting,
)
