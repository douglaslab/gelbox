import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./tests/production',fullyParallel:true,use:{...devices['Desktop Chrome'],deviceScaleFactor:2,viewport:{width:1365,height:768}},projects:[{name:'chromium-webgpu',use:{launchOptions:{args:['--enable-unsafe-webgpu','--ignore-gpu-blocklist']}}},{name:'chromium-webgl2'}]});
