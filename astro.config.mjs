// @ts-check

import sanity from "@sanity/astro";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

export default defineConfig({
  site: "https://nepali.no",

  integrations: [
    sanity({
      projectId: env.PUBLIC_SANITY_PROJECT_ID,
      dataset: env.PUBLIC_SANITY_DATASET,
      apiVersion: "2026-03-01",
      useCdn: false,
    }),
  ],

  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});
