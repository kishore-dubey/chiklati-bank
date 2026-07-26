import { basePreset } from "@chiklati/config/eslint-preset.mjs";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [...basePreset, ...nextCoreWebVitals];

export default config;
