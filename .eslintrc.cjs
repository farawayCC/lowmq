// eslint-disable-next-line no-undef
module.exports = {
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
        "semi": ["error", "never"],
        "comma-dangle": ["error", "always-multiline"],
    },
    overrides: [
        {
            files: ["*.js", "*.jsx"],
            rules: {
                "no-undef": "off",
            },
        },
    ],
}
