import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  // Ignorar arquivos
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'public/**',
      '*.config.js',
      '*.config.ts',
      'coverage/**',
      '.git/**',
      '.vscode/**',
      '.idea/**'
    ]
  },

  // Configuração base para JavaScript
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin
    },
    rules: {
      // Regras base do JavaScript
      ...js.configs.recommended.rules,

      // Regras do React
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-string-refs': 'error',
      'react/self-closing-comp': 'warn',

      // Regras do React Hooks
      ...reactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Regras do React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],

      // Regras de Acessibilidade (JSX-A11Y)
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-access-key': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',

      // Regras de Import
      'import/no-unresolved': 'off', // Pode ser problemático com path mapping
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'warn',
      'import/no-self-import': 'error',
      'import/no-cycle': 'warn',
      'import/no-useless-path-segments': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-duplicates': 'error',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index'
          ],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],

      // Regras JavaScript customizadas
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'arrow-spacing': 'warn',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
      'template-curly-spacing': 'warn',
      'computed-property-spacing': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'quote-props': ['warn', 'as-needed'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'always'],
      'comma-dangle': ['warn', 'only-multiline'],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'linebreak-style': 'off',
      'max-len': [
        'warn',
        {
          code: 100,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true
        }
      ],
      'eol-last': 'warn',
      'no-trailing-spaces': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
      'space-before-blocks': 'warn',
      'keyword-spacing': 'warn',
      'space-infix-ops': 'warn',
      'comma-spacing': 'warn',
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
      'curly': ['warn', 'multi-line'],
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-eq-null': 'off',
      'no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true
        }
      ],
      'no-shadow': 'warn',
      'no-return-assign': 'error',
      'no-param-reassign': [
        'warn',
        {
          props: true,
          ignorePropertyModificationsFor: [
            'acc', // for reduce accumulators
            'accumulator', // for reduce accumulators
            'e', // for e.returnvalue
            'ctx', // for Koa routing
            'req', // for Express requests
            'request', // for Express requests
            'res', // for Express responses
            'response', // for Express responses
            '$scope', // for Angular 1 scopes
            'staticContext', // for ReactRouter context
            'draft', // for immer
            'state' // for Redux state
          ]
        }
      ],

      // Regras específicas para o projeto educacional
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 100],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false
        }
      ],
      'complexity': ['warn', { max: 15 }],
      'max-depth': ['warn', { max: 4 }],
      'max-nested-callbacks': ['warn', { max: 3 }],
      'max-params': ['warn', { max: 4 }],
      'max-statements': ['warn', { max: 20 }]
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx']
        }
      }
    }
  },

  // Configurações específicas para testes (se houver)
  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      // Relaxar algumas regras para testes
      'no-magic-numbers': 'off',
      'max-statements': 'off',
      'max-len': 'off'
    }
  },

  // Configurações específicas para arquivos de configuração
  {
    files: ['*.config.{js,jsx}', 'src/utils/constants.js'],
    rules: {
      'no-magic-numbers': 'off',
      'max-len': 'off'
    }
  }
];