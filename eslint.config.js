import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default tseslint.config(
  {
    // Global ignores
    ignores: ["dist", "node_modules", ".vscode"],
  },
  // Base config
  ...tseslint.configs.recommended,
  // Prettier config
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
  // This must be last to override other configs
  prettierConfig,
);
