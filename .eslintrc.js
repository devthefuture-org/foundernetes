module.exports = {
  ignorePatterns: ["!.versionrc.js"],
  settings: {
    "import/resolver": {
      alias: true,
    },
  },
  extends: ["airbnb-base", "prettier", "plugin:jest/recommended"],
  plugins: ["prettier", "import", "jest"],
  rules: {
    "node/no-extraneous-require": [0],
    "import/no-commonjs": [0],
    "import/no-dynamic-require": [0],
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["scripts/**/*", "tests/**/*"],
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "index",
          "sibling",
          "object",
        ],
        pathGroups: [
          {
            group: "internal",
            pattern: "~/**",
          },
          {
            group: "internal",
            pattern: "~**",
          },
        ],
        pathGroupsExcludedImportTypes: [],
      },
    ],
    "global-require": [0],
    "no-restricted-syntax": [0],
    "no-async-promise-executor": [0],
    "no-nested-ternary": [0],
    "no-loop-func": [0],
    "no-new": [0],
    "func-names": [0],
    "no-plusplus": [0],
    "no-param-reassign": [0],
    "no-continue": [0],
    "no-unused-vars": [
      2,
      {
        vars: "all",
        args: "after-used",
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "no-console": [0],
    "no-throw-literal": [0],
    "no-await-in-loop": [0],
    "consistent-return": [0],
    "no-underscore-dangle": [0],
    "no-template-curly-in-string": [0],
    semi: ["error", "never"],
    "prettier/prettier": [
      "error",
      {
        semi: false,
        // printWidth: 80,
        // tabWidth: 2,
        // useTabs: false,
        // singleQuote: false,
        // bracketSpacing: true,
      },
    ],
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "script",
    env: [
      {
        node: true,
        es2021: true,
      },
    ],
  },
  globals: {
    AggregateError: true,
    dbug: true,
  },
}
