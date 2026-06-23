import powerbiVisuals from "eslint-plugin-powerbi-visuals";

export default [
    {
        ignores: ["node_modules/**", ".tmp/**", "dist/**", "**/*.d.ts"]
    },
    powerbiVisuals.configs.recommended,
    {
        files: ["src/**/*.ts"]
    }
];
