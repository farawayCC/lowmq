// eslint-disable-next-line no-undef
module.exports = {
    env: {
        node: true,
    },
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    plugins: [
        '@typescript-eslint',
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    rules: {
        // Possible errors
        "no-undef": "error",
        "no-unused-vars": "warn",
        "no-console": "off",
        "no-shadow": "warn",
        "no-use-before-define": "warn",

        // Stylistic issues
        "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
        "comma-dangle": ["error", "always-multiline"],
        "semi": ["error", "never"],
        "quotes": ["error", "single"],

        // ECMAScript 6
        "arrow-body-style": "warn",
        "no-var": "error",
        "prefer-const": "warn",
    },
    overrides: [
        {
            files: ["*.js", "*.jsx"],
            rules: {
                "no-undef": "off",
            },
        },
        {
            files: ["*.cjs"],
            rules: {
                "quotes": ["off", "backtick"],
            },
        },
    ],
}
