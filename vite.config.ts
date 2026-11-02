import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "English Coach — de A2 à B2",
        short_name: "English Coach",
        description: "Votre programme quotidien d'anglais, de A2 à B2. Gratuit, hors connexion.",
        lang: "fr",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f6f2",
        theme_color: "#0f5e57",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Le moteur d'IA locale (facultatif, ~6 Mo) n'est téléchargé qu'à la demande.
        globIgnores: ["**/web-llm-*.js"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 7000,
    rolldownOptions: {
      output: {
        chunkFileNames: (c) => (c.moduleIds.some((id) => id.includes("@mlc-ai")) ? "assets/web-llm-[hash].js" : "assets/[name]-[hash].js"),
      },
    },
  },
  test: { include: ["tests/unit/**/*.test.ts"] },
});
