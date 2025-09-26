/**
 * ESLint configuration for Photo Roasting Web App
 * Enforces code quality, accessibility, and constitutional compliance
 */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:jest/recommended',
    'prettier'
  ],
  plugins: [
    'jsx-a11y',
    'jest'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // Code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    
    // Constitutional compliance - file complexity
    'max-lines': ['error', { 
      max: 100, 
      skipBlankLines: true, 
      skipComments: true 
    }],
    'complexity': ['error', { max: 10 }],
    'max-depth': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    
    // JSDoc documentation requirements
    'valid-jsdoc': ['error', {
      requireReturn: true,
      requireReturnDescription: true,
      requireParamDescription: true,
      prefer: {
        returns: 'return'
      }
    }],
    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: true,
        FunctionExpression: true
      }
    }],
    
    // Accessibility rules (enhanced)
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    
    // Performance and security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  
  // File-specific overrides
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'require-jsdoc': 'off', // Tests don't need JSDoc
        'max-lines': ['error', { max: 150 }] // Tests can be slightly longer
      }
    },
    {
      files: ['*.config.js', 'vite.config.js'],
      rules: {
        'require-jsdoc': 'off' // Config files don't need JSDoc
      }
    }
  ]
};
