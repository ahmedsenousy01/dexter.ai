import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});
/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: ["node_modules/*"]
  },
  ...compat.config({
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: true
    },
    plugins: ["@typescript-eslint"],
    extends: ["plugin:@typescript-eslint/recommended-type-checked", "plugin:@typescript-eslint/stylistic-type-checked"]
  })
];

export default config;
