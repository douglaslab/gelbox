import base from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...base, testMatch: /native-particle-(raster|component)\.spec\.ts/ });
