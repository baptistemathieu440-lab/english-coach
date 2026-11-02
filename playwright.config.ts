import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:4173", launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined } },
  webServer: { command: "npm run build && npx vite preview --port 4173 --strictPort", port: 4173, reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
