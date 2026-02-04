// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vitePluginSvgr from "vite-plugin-svgr";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const siteUrl = process.env.SITE_URL || "http://localhost:4321";

// https://astro.build/config
export default defineConfig({
  site: siteUrl,

  vite: {
    plugins: [tailwindcss(), vitePluginSvgr({})],
    build: {
      assetsInlineLimit: 0,
    },
  },

  devToolbar: {
    enabled: false,
  },

  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes("/api/") &&
        !page.includes("/404"),
    }),
  ],

  markdown: {
    shikiConfig: {
      defaultColor: false,
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark",
      },
      wrap: true,
    },
  },

  prefetch: {
    prefetchAll: true,
  },

  output: "static",
});
