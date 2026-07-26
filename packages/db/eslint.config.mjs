import { basePreset } from "@chiklati/config/eslint-preset.mjs";

export default [
  ...basePreset,
  {
    ignores: ["prisma/migrations/**", "src/generated/**"],
  },
];
