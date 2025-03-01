/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  semi: true,
  singleQuote: false,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  trailingComma: "none",
  singleAttributePerLine: true,
  importOrder: ["^react$", "^next$", "<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"]
};

export default config;
