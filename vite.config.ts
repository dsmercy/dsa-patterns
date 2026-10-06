import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" + HashRouter => the built `dist/` works from any sub-path (GitHub Pages, S3, Netlify) with no server rewrites.
export default defineConfig({ base: "./", plugins: [react()] });
