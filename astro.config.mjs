// @ts-check

import sanity from "@sanity/astro";
import sitemap from "@astrojs/sitemap";
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
    sitemap({
      filter: (page) =>
        new URL(page).pathname !== "/" &&
        !/^\/(translations|api)(\/|$)/.test(new URL(page).pathname) &&
        !/\/(directory|events)\/submit\/?$/.test(page),
      // On-demand (SSR) public pages are not discovered by the integration.
      customPages: ["ne", "nb"].flatMap((lang) =>
        ["about", "contact", "privacy", "transparency"].map(
          (page) => `https://nepali.no/${lang}/${page}/`,
        ),
      ),
    }),
  ],

  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});
