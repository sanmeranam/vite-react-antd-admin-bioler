import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import node from "eslint-plugin-node";
import promise from "eslint-plugin-promise";

export default [
  // Base rules
  js.configs.recommended,

  // Common rules for both client and server
  {
    files: ["src/**/*.js", "src/**/*.ts", "src/**/*.jsx", "src/**/*.tsx"],
    rules: {
      "prettier/prettier": "error",
      "import/no-unresolved": "error",
    },
  },

  // React (Client) Configuration
  {
    files: ["src/client/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      reactHooks,
      prettier,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Node.js (Server) Configuration
  {
    files: ["src/server/**/*.js"],
    plugins: {
      node,
      importPlugin,
      promise,
    },
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "node/no-unsupported-features/es-syntax": "off",
      "node/no-missing-import": "off",
      "node/no-unpublished-import": "off",
      "promise/always-return": "warn",
    },
  },
];