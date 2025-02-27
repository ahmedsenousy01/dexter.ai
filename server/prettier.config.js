/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: false,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  trailingComma: "none",
  singleAttributePerLine: true,
  importOrder: ["<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"]
};

export default config;
