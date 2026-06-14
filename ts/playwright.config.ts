import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  use: {
    // Override with GEL_BASE_URL to target an already-running dev server on a
    // non-default port (e.g. when 5173 is occupied). Default unchanged.
    baseURL: process.env.GEL_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: process.env.GEL_BASE_URL ?? 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium-webgpu',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-unsafe-webgpu',
            '--enable-features=Vulkan',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
    {
      name: 'chromium-webgl2',
      use: {
        ...devices['Desktop Chrome'],
        // Tests in this project run against the WebGL2 path. Backend selection
        // is driven by localStorage.gelBackend = 'webgl2' (set by the test
        // beforeEach below).
        launchOptions: {
          args: [
            // Prevent headless Chrome from throttling rAF on CI runners.
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        },
      },
    },
  ],
});
