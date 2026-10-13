import { defineConfig, devices } from '@playwright/test';
import { linuxCiExcludedSpecs } from './tests/visual/linuxCiScope';

// Fixture imports and intercepted module URLs require a fresh Vite module graph.
// Reusing an HMR server can create distinct React contexts via ?t= URLs.
const externalBaseURL=process.env.GEL_BASE_URL;
const baseURL=externalBaseURL??'http://127.0.0.1:5187';
// The Linux CI gate runs the WebGL2 project minus specs that need WebGPU, macOS
// or hardware pixels; see tests/visual/linuxCiScope.ts.
const linuxCi=process.env.GEL_VISUAL_SCOPE==='linux-ci';

export default defineConfig({
  testDir: './tests/visual',
  testIgnore: linuxCi ? linuxCiExcludedSpecs.map(spec=>`**/${spec}`) : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // SwiftShader renders the loupe and 2x specs slowly enough to cross the defaults.
  ...(linuxCi ? { timeout: 90_000, expect: { timeout: 15_000 } } : {}),
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  use: {
    // An external server is an explicit diagnostic opt-in, not the default gate.
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: externalBaseURL?undefined:{
    command: 'npm run dev -- --host 127.0.0.1 --port 5187 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    ...(linuxCi ? [] : [
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
    ]),
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
